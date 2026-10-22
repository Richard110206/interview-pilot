package com.hewei.hzyjy.xunzhi.interview.learning;

import com.alibaba.fastjson2.*;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.hewei.hzyjy.xunzhi.interview.knowledge.dao.mapper.*;
import com.hewei.hzyjy.xunzhi.interview.questionbank.dao.mapper.QuestionBankMapper;
import com.hewei.hzyjy.xunzhi.interview.questionbank.rag.QuestionBankRagService.QuestionBankHit;
import com.hewei.hzyjy.xunzhi.interview.knowledge.rag.KnowledgeRagService.KnowledgeHit;
import cn.hutool.crypto.digest.DigestUtil;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.*;
import org.springframework.stereotype.Service;
import java.util.*;

/** Durable snapshots of cited material and model assessments, independent of Redis expiry. */
@Service @RequiredArgsConstructor
public class InterviewLearningStore {
    private final MongoTemplate mongo;
    private final QuestionBankMapper bank;
    private final KnowledgeChunkMapper chunks;
    private final KnowledgeDocumentMapper documents;

    @Data public static class Source {
        private String kind, id, title, content, referenceAnswer, scoringPoints, sourceNote;
        private Long documentId;
        private Integer pageStart, pageEnd;
        private String repositoryUrl,commitSha,filePath,sourceUrl;
        private Integer lineStart,lineEnd;
    }
    @Data public static class QuestionEvidence {
        @Id private String id;
        private String sessionId, questionNumber, question, origin;
        private List<Source> sources = List.of();
        private long recordedAt;
    }
    @Data public static class Assessment {
        @Id private String id;
        private String sessionId, question, answerHash, policy;
        private Map<String,Integer> dimensions;
        private int score;
        private long recordedAt;
    }
    public static String hash(String text) { return DigestUtil.sha256Hex(text == null ? "" : text); }
    public static String assessmentId(String session, String question, String answer) { return hash(session+"|"+question+"|"+hash(answer)); }
    public List<QuestionEvidence> evidence(String session) {
        return mongo.find(Query.query(Criteria.where("sessionId").is(session)),QuestionEvidence.class,"interview_question_evidence");
    }
    public Assessment assessment(String session,String question,String answer) {
        return mongo.findById(assessmentId(session,question,answer),Assessment.class,"interview_assessment");
    }
    public void recordAssessment(String session,String question,String answer,JSONObject result) {
        if (session==null || session.isBlank() || question==null || question.isBlank()) return;
        Assessment value = new Assessment();value.setId(assessmentId(session,question,answer));value.setSessionId(session);
        value.setQuestion(question);value.setAnswerHash(hash(answer));value.setDimensions(InterviewRubric.dimensions(result));
        value.setPolicy(value.getDimensions().isEmpty()?"legacy":InterviewRubric.VERSION);value.setScore(result.getIntValue("score"));value.setRecordedAt(System.currentTimeMillis());
        mongo.save(value,"interview_assessment");
    }
    public Source bankSource(long id) {
        var value=bank.selectById(id);if(value==null || !Integer.valueOf(0).equals(value.getDelFlag())) return null;
        Source s=new Source();s.setKind("question_bank");s.setId(Long.toString(id));s.setTitle(value.getSkillTag());s.setContent(value.getQuestionText());
        s.setReferenceAnswer(value.getReferenceAnswer());s.setScoringPoints(value.getScoringPoints());s.setSourceNote(value.getSource());return s;
    }
    public Source knowledgeSource(String key) {
        long id;try{id=Long.parseLong(key);}catch(Exception ex){return null;}
        var chunk=chunks.selectById(id);if(chunk==null || !Integer.valueOf(0).equals(chunk.getDelFlag())) return null;
        var doc=documents.selectById(chunk.getDocumentId());if(doc==null || !Integer.valueOf(0).equals(doc.getDelFlag())) return null;
        Source s=new Source();s.setKind("knowledge");s.setId(key);s.setDocumentId(doc.getId());s.setTitle(doc.getTitle()+" · "+chunk.getHeading());
        s.setContent(chunk.getContent());s.setSourceNote(doc.getSourceNote());s.setPageStart(chunk.getPageStart());s.setPageEnd(chunk.getPageEnd());return s;
    }
    public void recordExtraction(String session,JSONObject output,List<QuestionBankHit> bankHits,List<KnowledgeHit> knowledgeHits) {
        recordExtraction(session,output,bankHits,knowledgeHits,List.of());
    }
    public void recordExtraction(String session,JSONObject output,List<QuestionBankHit> bankHits,List<KnowledgeHit> knowledgeHits,List<Source> codeSources) {
        if(session==null || session.isBlank()) return;
        JSONArray questions=output.getJSONArray("questions");if(questions==null)return;
        JSONArray ids=output.getJSONArray("source_ids"), knowledgeIds=output.getJSONArray("knowledge_source_ids");
        Set<Long> allowedBank=new HashSet<>();bankHits.forEach(h->allowedBank.add(h.id()));
        Set<String> allowedKnowledge=new HashSet<>();knowledgeHits.forEach(h->allowedKnowledge.add(h.chunkKey()));
        for(int i=0;i<questions.size();i++){
            QuestionEvidence q=new QuestionEvidence();q.setId(hash(session+"|"+(i+1)));q.setSessionId(session);q.setQuestionNumber(Integer.toString(i+1));q.setQuestion(questions.getString(i));q.setRecordedAt(System.currentTimeMillis());
            var refs=new ArrayList<Source>();
            if(ids!=null && i<ids.size() && ids.get(i)!=null){try{long id=Long.parseLong(ids.get(i).toString());if(allowedBank.contains(id)){Source s=bankSource(id);if(s!=null)refs.add(s);}}catch(NumberFormatException ignored){}}
            if(knowledgeIds!=null && i<knowledgeIds.size() && knowledgeIds.get(i) instanceof List<?> selected){
                for(Object key:selected.stream().limit(3).toList()){if(key!=null && allowedKnowledge.contains(key.toString())){Source s=knowledgeSource(key.toString());if(s!=null)refs.add(s);}}
            }
            JSONArray codeIds=output.getJSONArray("code_source_ids");
            if(codeIds!=null && i<codeIds.size() && codeIds.get(i) instanceof List<?> selected) {
                selected.stream().limit(3).forEach(key->codeSources.stream().filter(s->s.getId().equals(String.valueOf(key))).findFirst().ifPresent(refs::add));
            }
            q.setSources(refs);q.setOrigin(refs.isEmpty()?"生成题 · 未记录资料引用":"依据检索资料改编");mongo.save(q,"interview_question_evidence");
        }
    }
}
