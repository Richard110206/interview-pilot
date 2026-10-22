package com.hewei.hzyjy.xunzhi.interview.project;

import com.hewei.hzyjy.xunzhi.common.convention.exception.ClientException;
import com.hewei.hzyjy.xunzhi.interview.execution.InterviewExecutionTrace;
import com.hewei.hzyjy.xunzhi.interview.flow.session.InterviewSessionFacade;
import com.hewei.hzyjy.xunzhi.interview.service.InterviewSessionService;
import com.hewei.hzyjy.xunzhi.interview.direct.DirectInterviewProperties;
import com.hewei.hzyjy.xunzhi.interview.dao.entity.InterviewSession;
import com.hewei.hzyjy.xunzhi.interview.project.GitHubRepositoryClient.*;
import org.junit.jupiter.api.Test;
import java.io.*;
import java.util.*;
import java.util.zip.*;
import java.net.URI;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class GitHubRepositoryTest {
    @Test void extractsRepositoryAndScopedBranchLinkFromNaturalMessage() {
        var root=GitHubRepositoryClient.parseMessage("用这个项目问我：https://github.com/acme/demo.git，我负责缓存。");
        assertEquals("https://github.com/acme/demo",root.url());
        var scoped=GitHubRepositoryClient.parseMessage("https://github.com/acme/demo/tree/feature/cache/src/main");
        assertEquals("tree",scoped.kind());assertEquals(List.of("feature","cache","src","main"),scoped.tail());
    }
    @Test void rejectsOtherHostsTraversalAndNonSourcePages() {
        for(String value:List.of("https://github.com.evil.test/a/b","http://127.0.0.1/a/b","https://github.com/a/b/tree/main/%2e%2e/private","https://github.com/a/b/issues/1","https://github.com/a/b https://github.com/a/c"))
            assertThrows(RuntimeException.class,()->GitHubRepositoryClient.parseMessage(value),value);
    }
    @Test void filtersDependenciesAndKeepsOnlyRequestedModule() throws Exception {
        byte[] zip=archive(Map.of("repo-sha/src/Order.java","class Order {}\n","repo-sha/node_modules/a/index.js","bad","repo-sha/.env","PASSWORD=bad","repo-sha/docs/readme.md","docs"));
        var all=GitHubRepositoryClient.readArchive(zip,"",false);assertEquals(2,all.size());
        var scoped=GitHubRepositoryClient.readArchive(zip,"src",false);assertEquals(1,scoped.size());assertEquals("src/Order.java",scoped.getFirst().path());
        assertEquals(1,GitHubRepositoryClient.readArchive(zip,"src/Order.java",true).size());
    }
    @Test void neverAcceptsArchiveTraversal() throws Exception {
        byte[] zip=archive(Map.of("repo/../escape.java","bad"));assertThrows(ClientException.class,()->GitHubRepositoryClient.readArchive(zip,"",false));
    }
    @Test void redactionPreservesLineNumbers() {
        String text="first\n-----BEGIN PRIVATE KEY-----\nsecret-key\n-----END PRIVATE KEY-----\napiKey=abc\nlast";
        String result=GitHubRepositoryClient.redact(text);assertFalse(result.contains("secret-key"));assertFalse(result.contains("abc"));assertEquals(text.lines().count(),result.lines().count());assertTrue(result.endsWith("last"));
    }
    @Test void chunksKeepExactLineRangesAndPinnedSourceUrls() {
        String text=String.join("\n",java.util.stream.IntStream.rangeClosed(1,170).mapToObj(i->"line "+i).toList());
        var snapshot=new Snapshot("https://github.com/acme/demo","a".repeat(40),"","Java","",List.of(new CodeFile("src/Order.java",text)),1,0);
        var chunks=InterviewProjectStore.split("s","job",1L,snapshot);
        assertEquals(3,chunks.size());assertEquals(81,chunks.get(1).getLineStart());assertEquals("line 81",chunks.get(1).getContent().lines().findFirst().orElseThrow());
        var source=chunks.get(1).source();assertEquals(160,source.getLineEnd());assertTrue(source.getSourceUrl().contains("/blob/"+"a".repeat(40)+"/src/Order.java#L81-L160"));
        assertNotEquals(chunks.getFirst().getId(),InterviewProjectStore.split("other","job",2L,snapshot).getFirst().getId());
    }
    @Test void outboundHostsCannotBeChosenByUser() {
        var client=new GitHubRepositoryClient();assertThrows(ClientException.class,()->client.get(URI.create("https://127.0.0.1/a"),100));
        assertThrows(ClientException.class,()->client.get(URI.create("https://github.com:8080/a"),100));
    }
    @Test void resolvesSlashBranchAndDirectoryWithoutInvalidCommitProbes() throws Exception {
        String sha="b".repeat(40);
        byte[] zip=archive(Map.of("repo/src/Order.java","class Order {}","repo/docs/readme.md","docs"));
        var client=new GitHubRepositoryClient(){
            @Override protected byte[] get(URI uri,int limit) {
                assertNotEquals("api.github.com",uri.getHost());
                if(uri.getHost().equals("github.com"))return ("001e# service=git-upload-pack\n"+"a".repeat(40)+" HEAD\u0000caps\n"+sha+" refs/heads/feature/cache\n").getBytes(java.nio.charset.StandardCharsets.UTF_8);
                assertTrue(uri.getPath().endsWith("/zip/"+sha));return zip;
            }
        };
        var result=client.fetch(GitHubRepositoryClient.parseMessage("https://github.com/acme/demo/tree/feature/cache/src"));
        assertEquals(sha,result.commitSha());assertEquals("src",result.scope());assertEquals(1,result.files().size());
    }
    @Test void onlyRetrievedCodeCanBeSavedAsQuestionEvidence() {
        var mongo=mock(org.springframework.data.mongodb.core.MongoTemplate.class);
        var store=new com.hewei.hzyjy.xunzhi.interview.learning.InterviewLearningStore(mongo,
                mock(com.hewei.hzyjy.xunzhi.interview.questionbank.dao.mapper.QuestionBankMapper.class),
                mock(com.hewei.hzyjy.xunzhi.interview.knowledge.dao.mapper.KnowledgeChunkMapper.class),
                mock(com.hewei.hzyjy.xunzhi.interview.knowledge.dao.mapper.KnowledgeDocumentMapper.class));
        var source=new com.hewei.hzyjy.xunzhi.interview.learning.InterviewLearningStore.Source();source.setId("real");source.setKind("code");source.setContent("original code");source.setCommitSha("a".repeat(40));source.setFilePath("src/Order.java");source.setLineStart(8);
        store.recordExtraction("s",com.alibaba.fastjson2.JSON.parseObject("{\"questions\":[\"Question\"],\"code_source_ids\":[[\"fake\",\"real\"]]}"),List.of(),List.of(),List.of(source));
        var captured=org.mockito.ArgumentCaptor.forClass(com.hewei.hzyjy.xunzhi.interview.learning.InterviewLearningStore.QuestionEvidence.class);verify(mongo).save(captured.capture(),eq("interview_question_evidence"));
        assertEquals(1,captured.getValue().getSources().size());assertEquals(8,captured.getValue().getSources().getFirst().getLineStart());assertEquals("a".repeat(40),captured.getValue().getSources().getFirst().getCommitSha());
    }
    @Test void ownershipIsCheckedBeforeImportOrReading() {
        var sessions=mock(InterviewSessionService.class);var store=mock(InterviewProjectStore.class);var github=mock(GitHubRepositoryClient.class);
        doThrow(new ClientException("not owned")).when(sessions).requireOwnedSession("other",1L);
        var service=new InterviewProjectImportService(store,github,sessions,mock(InterviewSessionFacade.class),mock(InterviewExecutionTrace.class),new DirectInterviewProperties());
        assertThrows(ClientException.class,()->service.submit("other",1L,"user","https://github.com/a/b"));assertThrows(ClientException.class,()->service.read("other",1L));verifyNoInteractions(store,github);service.close();
    }
    @Test void finishedSessionsCannotImportProjects() {
        var sessions=mock(InterviewSessionService.class);var session=new InterviewSession();session.setStatus("FINISHED");when(sessions.requireOwnedSession("s",1L)).thenReturn(session);
        var github=mock(GitHubRepositoryClient.class);var store=mock(InterviewProjectStore.class);
        var service=new InterviewProjectImportService(store,github,sessions,mock(InterviewSessionFacade.class),mock(InterviewExecutionTrace.class),new DirectInterviewProperties());
        assertThrows(ClientException.class,()->service.submit("s",1L,"u","https://github.com/a/b"));verifyNoInteractions(github,store);service.close();
    }
    static byte[] archive(Map<String,String> files) throws IOException {
        var bytes=new ByteArrayOutputStream();try(var zip=new ZipOutputStream(bytes)){for(var e:files.entrySet()){zip.putNextEntry(new ZipEntry(e.getKey()));zip.write(e.getValue().getBytes(java.nio.charset.StandardCharsets.UTF_8));zip.closeEntry();}}return bytes.toByteArray();
    }
}
