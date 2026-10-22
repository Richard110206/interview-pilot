package com.hewei.hzyjy.xunzhi.interview.learning;
import com.alibaba.fastjson2.*;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import java.util.*;
import com.hewei.hzyjy.xunzhi.common.convention.exception.ClientException;
import com.hewei.hzyjy.xunzhi.interview.service.*;
import com.hewei.hzyjy.xunzhi.interview.dao.mapper.InterviewRecordMapper;
import org.springframework.data.mongodb.core.MongoTemplate;

class InterviewLearningTest {
 @Test void stableWeightedRubricAndOffTopicCap(){
  var result=JSON.parseObject("{\"score\":100,\"dimensions\":{\"accuracy\":80,\"completeness\":60,\"reasoning\":50,\"expression\":100}}");
  InterviewRubric.apply(result);assertEquals(70,result.getIntValue("score"));assertEquals("text-v1",result.getString("grading_policy"));
  result.put("relevance","off_topic");InterviewRubric.apply(result);assertEquals(20,result.getIntValue("score"));
 }
 @Test void incompleteAndNonFiniteDimensionsAreNotInvented(){
  var legacy=JSON.parseObject("{\"score\":82}");InterviewRubric.apply(legacy);assertEquals(82,legacy.getIntValue("score"));assertTrue(InterviewRubric.dimensions(legacy).isEmpty());
  legacy.put("dimensions",Map.of("accuracy",Double.NaN,"completeness",70,"reasoning",70,"expression",70));assertTrue(InterviewRubric.dimensions(legacy).isEmpty());
 }
 @Test void followupsDoNotCountTwiceAndMissingScoresStayAbsent(){
  assertTrue(InterviewLearningService.primary("1",false));assertFalse(InterviewLearningService.primary("1-F1",false));assertFalse(InterviewLearningService.primary("2",true));
  assertNull(InterviewLearningService.average(List.of()));assertNull(InterviewLearningService.composite(90,null));
  assertEquals(80,InterviewLearningService.composite(null,80));assertEquals(82,InterviewLearningService.composite(90,80));
 }
 @Test void rejectsOtherUsersItemBeforeAnyUpdate(){
  var mongo=mock(MongoTemplate.class);var item=new InterviewLearningService.StudyItem();item.setUserId(2L);
  when(mongo.findById("item",InterviewLearningService.StudyItem.class,"interview_study_item")).thenReturn(item);
  var service=new InterviewLearningService(mock(InterviewSessionService.class),mock(InterviewRecordService.class),mock(InterviewRecordMapper.class),mock(InterviewLearningStore.class),mongo);
  assertThrows(ClientException.class,()->service.favorite("item",1L,true));verify(mongo).findById("item",InterviewLearningService.StudyItem.class,"interview_study_item");verifyNoMoreInteractions(mongo);
 }
 @Test void reportOwnershipIsCheckedBeforeReadingPrivateMaterial(){
  var sessions=mock(InterviewSessionService.class);var records=mock(InterviewRecordService.class);var store=mock(InterviewLearningStore.class);
  doThrow(new ClientException("not owned")).when(sessions).requireOwnedSession("other",1L);
  var service=new InterviewLearningService(sessions,records,mock(InterviewRecordMapper.class),store,mock(MongoTemplate.class));
  assertThrows(ClientException.class,()->service.report("other",1L));verifyNoInteractions(records,store);
 }
 @Test void assessmentIdentityIncludesQuestionAndAnswer(){
  assertNotEquals(InterviewLearningStore.assessmentId("s","q1","answer"),InterviewLearningStore.assessmentId("s","q2","answer"));
  assertNotEquals(InterviewLearningStore.assessmentId("s","q","answer1"),InterviewLearningStore.assessmentId("s","q","answer2"));
 }
 @Test void onlyRetrievedReferencesAreSavedAndPagesSurviveAsSnapshot(){
  var mongo=mock(MongoTemplate.class);
  var bank=mock(com.hewei.hzyjy.xunzhi.interview.questionbank.dao.mapper.QuestionBankMapper.class);
  var chunks=mock(com.hewei.hzyjy.xunzhi.interview.knowledge.dao.mapper.KnowledgeChunkMapper.class);
  var docs=mock(com.hewei.hzyjy.xunzhi.interview.knowledge.dao.mapper.KnowledgeDocumentMapper.class);
  var chunk=new com.hewei.hzyjy.xunzhi.interview.knowledge.dao.entity.KnowledgeChunkDO();chunk.setId(22L);chunk.setDocumentId(9L);chunk.setDelFlag(0);chunk.setContent("Original reference");chunk.setHeading("Section");chunk.setPageStart(3);chunk.setPageEnd(4);
  var doc=new com.hewei.hzyjy.xunzhi.interview.knowledge.dao.entity.KnowledgeDocumentDO();doc.setId(9L);doc.setDelFlag(0);doc.setTitle("Book");
  when(chunks.selectById(22L)).thenReturn(chunk);when(docs.selectById(9L)).thenReturn(doc);
  var store=new InterviewLearningStore(mongo,bank,chunks,docs);
  store.recordExtraction("s",JSON.parseObject("{\"questions\":[\"Question\"],\"source_ids\":[999],\"knowledge_source_ids\":[[\"22\",\"fake\"]]}"),List.of(),List.of(new com.hewei.hzyjy.xunzhi.interview.knowledge.rag.KnowledgeRagService.KnowledgeHit("22",9L,"Section",.9,"Original reference")));
  var captured=org.mockito.ArgumentCaptor.forClass(InterviewLearningStore.QuestionEvidence.class);
  verify(mongo).save(captured.capture(),eq("interview_question_evidence"));verifyNoInteractions(bank);
  assertEquals(1,captured.getValue().getSources().size());assertEquals(3,captured.getValue().getSources().get(0).getPageStart());
  chunk.setContent("Changed later");assertEquals("Original reference",captured.getValue().getSources().get(0).getContent());
 }
}
