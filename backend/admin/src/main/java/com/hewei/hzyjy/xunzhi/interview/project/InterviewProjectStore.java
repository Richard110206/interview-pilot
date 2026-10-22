package com.hewei.hzyjy.xunzhi.interview.project;

import com.hewei.hzyjy.xunzhi.common.convention.exception.ClientException;
import com.hewei.hzyjy.xunzhi.interview.learning.InterviewLearningStore;
import com.hewei.hzyjy.xunzhi.interview.learning.InterviewLearningStore.Source;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.*;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.regex.Pattern;

/** Private, session-scoped immutable code chunks. No global knowledge index contamination. */
@Service @RequiredArgsConstructor
public class InterviewProjectStore {
    static final String JOBS="interview_project_import",CHUNKS="interview_project_code";
    private final MongoTemplate mongo;
    @Data public static class ImportJob {
        @Id private String id;
        private Long userId;
        private String jobId,messageHash,message,repositoryUrl,commitSha,language,scope,description,status,error;
        private int fileCount,eligibleFiles,skippedFiles,chunkCount;
        private long updatedAt;
        private boolean questionsPrepared;
    }
    @Data public static class CodeChunk {
        @Id private String id;
        private String sessionId,jobId,repositoryUrl,commitSha,path,content,searchText;
        private Long userId;
        private int lineStart,lineEnd;
        public Source source() {
            Source s=new Source();s.setKind("code");s.setId(id);s.setTitle(path+":"+lineStart+"—"+lineEnd);s.setContent(content);
            s.setRepositoryUrl(repositoryUrl);s.setCommitSha(commitSha);s.setFilePath(path);s.setLineStart(lineStart);s.setLineEnd(lineEnd);
            String encoded=Arrays.stream(path.split("/")).map(p->java.net.URLEncoder.encode(p,java.nio.charset.StandardCharsets.UTF_8).replace("+","%20")).reduce((a,b)->a+"/"+b).orElse("");
            s.setSourceUrl(repositoryUrl+"/blob/"+commitSha+"/"+encoded+"#L"+lineStart+"-L"+lineEnd);
            s.setSourceNote("本场引用的 GitHub 源码快照 · "+commitSha.substring(0,12));return s;
        }
    }
    public ImportJob read(String session){return mongo.findById(session,ImportJob.class,JOBS);}
    public ImportJob claim(String session,Long user,String message,boolean needsQuestions) {
        String hash=InterviewLearningStore.hash(message.trim());ImportJob existing=read(session);long now=System.currentTimeMillis();
        if(existing!=null) {
            if(!user.equals(existing.userId))throw new ClientException("不能访问其他用户的项目");
            if(hash.equals(existing.messageHash)&&!"FAILED".equals(existing.status)&&existing.updatedAt>now-600000 && !(needsQuestions&&"READY".equals(existing.status)&&!existing.questionsPrepared))return existing;
            if(busy(existing)&&existing.updatedAt>now-600000)throw new ClientException("正在读取本场的项目，请等待完成后再发送其他仓库");
        }
        var c=Criteria.where("_id").is(session).orOperator(Criteria.where("status").in("READY","FAILED"),Criteria.where("updatedAt").lt(now-600000),Criteria.where("status").exists(false));
        var update=new Update().set("userId",user).set("jobId",UUID.randomUUID().toString()).set("messageHash",hash).set("message",message.trim()).set("status","QUEUED").set("error",null).set("updatedAt",now).set("questionsPrepared",false)
                .unset("commitSha").unset("repositoryUrl").set("fileCount",0).set("chunkCount",0);
        try { return mongo.findAndModify(Query.query(c),update,org.springframework.data.mongodb.core.FindAndModifyOptions.options().upsert(true).returnNew(true),ImportJob.class,JOBS); }
        catch(org.springframework.dao.DuplicateKeyException ex) {
            var value=read(session);if(value!=null&&hash.equals(value.messageHash))return value;throw new ClientException("项目正在读取，请稍后重试");
        }
    }
    public static boolean busy(ImportJob j){return j!=null&&!Set.of("READY","FAILED").contains(j.status);}
    public boolean dispatch(ImportJob j) {
        return mongo.updateFirst(Query.query(Criteria.where("_id").is(j.id).and("jobId").is(j.jobId).and("status").is("QUEUED")),new Update().set("status","FETCHING").set("updatedAt",System.currentTimeMillis()),ImportJob.class,JOBS).getModifiedCount()==1;
    }
    public void status(ImportJob j,String status,String error) {
        j.status=status;j.error=error;j.updatedAt=System.currentTimeMillis();
        mongo.updateFirst(Query.query(Criteria.where("_id").is(j.id).and("jobId").is(j.jobId)),new Update().set("status",status).set("error",error).set("updatedAt",j.updatedAt).set("questionsPrepared",j.questionsPrepared),ImportJob.class,JOBS);
    }
    public void saveSnapshot(ImportJob j,GitHubRepositoryClient.Snapshot snapshot) {
        var chunks=split(j.id,j.jobId,j.userId,snapshot);if(chunks.isEmpty())throw new ClientException("没有可用于提问的源码片段");
        mongo.insert(chunks,CHUNKS);
        j.repositoryUrl=snapshot.repositoryUrl();j.commitSha=snapshot.commitSha();j.language=snapshot.language();j.scope=snapshot.scope();j.description=snapshot.description();
        j.fileCount=snapshot.files().size();j.eligibleFiles=snapshot.eligibleFiles();j.skippedFiles=snapshot.skippedFiles();j.chunkCount=chunks.size();
        mongo.updateFirst(Query.query(Criteria.where("_id").is(j.id).and("jobId").is(j.jobId)),new Update().set("repositoryUrl",j.repositoryUrl).set("commitSha",j.commitSha).set("language",j.language).set("scope",j.scope).set("description",j.description)
                .set("fileCount",j.fileCount).set("eligibleFiles",j.eligibleFiles).set("skippedFiles",j.skippedFiles).set("chunkCount",j.chunkCount),ImportJob.class,JOBS);
    }
    static List<CodeChunk> split(String session,String job,Long user,GitHubRepositoryClient.Snapshot snapshot) {
        var result=new ArrayList<CodeChunk>();
        for(var file:snapshot.files()) {
            String[] lines=file.content().split("\\r?\\n",-1);
            for(int start=0;start<lines.length && result.size()<1600;) {
                int end=start,chars=0;
                while(end<lines.length && end-start<80 && chars<3000){chars+=lines[end].length()+1;end++;}
                String text=String.join("\n",Arrays.copyOfRange(lines,start,end));
                if(text.length()>12000)text=text.substring(0,12000)+"\n[超长行已截断]";
                CodeChunk c=new CodeChunk();c.id=InterviewLearningStore.hash(session+"|"+job+"|"+file.path()+"|"+start);c.sessionId=session;c.jobId=job;c.userId=user;
                c.repositoryUrl=snapshot.repositoryUrl();c.commitSha=snapshot.commitSha();c.path=file.path();c.content=text;c.lineStart=start+1;c.lineEnd=end;
                c.searchText=(file.path()+"\n"+text).toLowerCase(Locale.ROOT);result.add(c);start=end;
            }
        }
        return result;
    }
    public List<Source> search(String session,String query,int limit) {
        var j=read(session);if(j==null||j.commitSha==null||"FAILED".equals(j.status))return List.of();
        var chunks=mongo.find(Query.query(Criteria.where("sessionId").is(session).and("jobId").is(j.jobId).and("userId").is(j.userId)).limit(1600),CodeChunk.class,CHUNKS);
        String expanded=expand(query==null?"":query)+" "+(j.language==null?"":j.language);
        Set<String> words=new LinkedHashSet<>(Arrays.asList(expanded.toLowerCase(Locale.ROOT).split("[^\\p{L}\\p{N}_]+")));
        words.removeIf(s->s.length()<2);var scores=new HashMap<String,Integer>();
        boolean askingTests=Pattern.compile("测试|\\btests?\\b",Pattern.CASE_INSENSITIVE).matcher(query==null?"":query).find();
        for(var c:chunks) {int score=0;for(String word:words)if(c.searchText.contains(word)){score+=word.length()>20?1:4;if(c.path.toLowerCase(Locale.ROOT).contains(word))score+=6;}
            String path=c.path.toLowerCase(Locale.ROOT);
            if(path.contains("src/main/"))score+=8;
            if(!askingTests&&(path.contains("/test/")||path.contains("/tests/")||path.matches(".*tests?\\.[a-z]+$")))score-=24;
            if(c.path.toLowerCase(Locale.ROOT).contains("readme"))score+=query==null||query.isBlank()?5:0;scores.put(c.id,score);}
        chunks.sort(Comparator.<CodeChunk>comparingInt(c->-scores.get(c.id)).thenComparing(CodeChunk::getPath).thenComparingInt(CodeChunk::getLineStart));
        var selected=new ArrayList<Source>();var perFile=new HashMap<String,Integer>();int size=0;
        for(var c:chunks) {if(selected.size()>=limit)break;if(perFile.getOrDefault(c.path,0)>=2 || size+c.content.length()>18000)continue;selected.add(c.source());size+=c.content.length();perFile.merge(c.path,1,Integer::sum);}
        return selected;
    }
    static String expand(String query) {
        String q=query;
        String[][] aliases={{"事务","transaction transactional commit rollback"},{"并发","concurrent synchronized lock version atomic"},{"库存","stock inventory quantity"},{"缓存","cache redis expire"},{"订单","order payment"},{"登录","login auth token security"},{"测试","test assert mock"},{"接口","controller handler route request"},{"数据库","repository mapper select update sql"},{"前端","component state props fetch"}};
        for(var pair:aliases)if(q.contains(pair[0]))q+=" "+pair[1];return q;
    }
    public String overview(String session) {
        var j=read(session);if(j==null||j.commitSha==null)return "";
        return "仓库="+j.repositoryUrl+"；版本="+j.commitSha+"；语言="+j.language+"；目录范围="+j.scope+"；说明="+j.description+"；用户提供的负责模块描述（未验证作者身份）="+j.message
                +"；已索引"+j.fileCount+"文件/"+j.chunkCount+"片段，按容量选择，未表示完整理解整个项目。";
    }
}
