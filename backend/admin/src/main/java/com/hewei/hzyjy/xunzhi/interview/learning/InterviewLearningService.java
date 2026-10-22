package com.hewei.hzyjy.xunzhi.interview.learning;

import com.alibaba.fastjson2.*;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.hewei.hzyjy.xunzhi.common.convention.exception.ClientException;
import com.hewei.hzyjy.xunzhi.interview.dao.entity.InterviewRecordDO;
import com.hewei.hzyjy.xunzhi.interview.dao.mapper.InterviewRecordMapper;
import com.hewei.hzyjy.xunzhi.interview.service.*;
import com.hewei.hzyjy.xunzhi.interview.learning.InterviewLearningStore.*;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.*;
import org.springframework.stereotype.Service;
import java.util.*;

@Service @RequiredArgsConstructor
public class InterviewLearningService {
    private final InterviewSessionService sessions;
    private final InterviewRecordService records;
    private final InterviewRecordMapper recordMapper;
    private final InterviewLearningStore store;
    private final MongoTemplate mongo;
    @Data public static class StudyItem {
        @Id private String id;
        private Long userId;
        private String sessionId, questionNumber, question, answer, feedback, policy;
        private Integer latestScore;
        private boolean favorite;
        private long updatedAt, lastObservedAt;
        private List<Source> sources=List.of();
        private Map<String,Integer> dimensions=Map.of();
    }
    @Data public static class PracticeAttempt {
        @Id private String id;
        private Long userId;
        private String itemId, answerHash, status, resultJson;
        private long createdAt;
    }
    public static boolean primary(String number,Boolean followup) {
        return !Boolean.TRUE.equals(followup) && number!=null && !number.toUpperCase(Locale.ROOT).contains("-F");
    }
    public static Integer average(List<Integer> scores) { return scores.isEmpty()?null:(int)Math.round(scores.stream().mapToInt(Integer::intValue).average().orElse(0)); }
    public static Integer composite(Integer resume,Integer interview) { return interview==null?null:resume==null?interview:(int)Math.round(resume*.2+interview*.8); }

    public Map<String,Object> report(String sessionId,Long userId) {
        sessions.requireOwnedSession(sessionId,userId);
        var record=records.getBySessionId(sessionId,userId);
        var evidence=store.evidence(sessionId);
        Map<String,QuestionEvidence> byNumber=new HashMap<>();evidence.forEach(e->byNumber.put(e.getQuestionNumber(),e));
        var rows=new ArrayList<Map<String,Object>>();var scores=new ArrayList<Integer>();
        var dimensionValues=new LinkedHashMap<String,List<Integer>>();InterviewRubric.WEIGHTS.keySet().forEach(k->dimensionValues.put(k,new ArrayList<>()));
        int calibrated=0;
        var turns=record.getPlaybackItems()==null?List.<com.hewei.hzyjy.xunzhi.interview.api.io.resp.InterviewPlaybackItemRespDTO>of():record.getPlaybackItems();
        // Accepted turn logs are the authority; uncommitted model observations never become report answers.
        var accepted=new LinkedHashMap<String,com.hewei.hzyjy.xunzhi.interview.api.io.resp.InterviewPlaybackItemRespDTO>();
        for(var turn:turns)if(turn.getQuestionNumber()!=null)accepted.put(turn.getQuestionNumber(),turn);
        Set<String> represented=new HashSet<>();
        for(var turn:accepted.values()) {
            boolean main=primary(turn.getQuestionNumber(),turn.getIsFollowUp());
            String parent=turn.getQuestionNumber().split("-F")[0];
            var ref=byNumber.get(parent);
            if(main && ref!=null && !Objects.equals(ref.getQuestion(),turn.getQuestionContent()))ref=null;
            var assessment=store.assessment(sessionId,turn.getQuestionContent(),turn.getAnswerContent());
            Integer score=turn.getScore();
            Map<String,Integer> dims=assessment==null || assessment.getDimensions()==null?Map.of():assessment.getDimensions();
            if(main && score!=null){scores.add(score);if(dims.size()==4){calibrated++;dims.forEach((key,value)->dimensionValues.get(key).add(value));}}
            var row=new LinkedHashMap<String,Object>();row.put("questionNumber",turn.getQuestionNumber());row.put("question",turn.getQuestionContent());row.put("answer",turn.getAnswerContent());row.put("score",score);row.put("feedback",turn.getFeedback());row.put("followUp",!main);row.put("dimensions",dims);
            row.put("sources",ref==null?List.of():ref.getSources());row.put("origin",ref==null?"历史题目 · 未记录来源":main?ref.getOrigin():"追问 · 沿用主问题参考资料");
            if(main){
                var item=ensureItem(userId,sessionId,turn.getQuestionNumber(),turn.getQuestionContent(),turn.getAnswerContent(),turn.getFeedback(),score,ref==null?List.of():ref.getSources(),dims,turn.getTimestamp()==null?0:turn.getTimestamp());
                row.put("itemId",item.getId());row.put("favorite",item.isFavorite());
            }
            rows.add(row);represented.add(turn.getQuestionNumber());
        }
        for(var ref:evidence)if(!represented.contains(ref.getQuestionNumber())){
            var item=ensureItem(userId,sessionId,ref.getQuestionNumber(),ref.getQuestion(),"","",null,ref.getSources(),Map.of(),ref.getRecordedAt());
            var row=new LinkedHashMap<String,Object>();row.put("questionNumber",ref.getQuestionNumber());row.put("question",ref.getQuestion());row.put("score",null);row.put("sources",ref.getSources());row.put("origin",ref.getOrigin());row.put("dimensions",Map.of());row.put("itemId",item.getId());row.put("favorite",item.isFavorite());row.put("followUp",false);rows.add(row);
        }
        var dimensions=new ArrayList<Map<String,Object>>();
        dimensionValues.forEach((key,values)->{Integer value=average(values);if(value!=null)dimensions.add(Map.of("key",key,"label",InterviewRubric.LABELS.get(key),"value",value,"weight",InterviewRubric.WEIGHTS.get(key)));});
        Integer interview=average(scores),total=composite(record.getResumeScore(),interview);
        String policy=calibrated==scores.size() && calibrated>0?InterviewRubric.VERSION:"legacy-mixed";
        var result=new LinkedHashMap<String,Object>();result.put("sessionId",sessionId);result.put("questions",rows);result.put("dimensions",dimensions);result.put("primaryCount",scores.size());result.put("dimensionCoverage",calibrated);result.put("interviewScore",interview);result.put("compositeScore",total);result.put("gradingPolicy",policy);
        result.put("gradingPolicyText","回答分为已作答主问题均分，追问不重复计分；综合分=简历20%+回答80%，无简历评分时仅用回答分。四维：准确性40%、完整性30%、分析取舍20%、表达10%。未答题不计零分；仅作练习反馈。");
        if(!scores.isEmpty()) {
            var summary=new org.bson.Document("_id",sessionId).append("userId",userId).append("sessionId",sessionId).append("date",record.getEndTime()==null?record.getCreateTime():record.getEndTime()).append("direction",record.getInterviewDirection()).append("primaryCount",scores.size()).append("interviewScore",interview).append("compositeScore",total).append("gradingPolicy",policy).append("dimensions",dimensions);
            mongo.save(summary,"interview_learning_summary");
        }
        return result;
    }
    private StudyItem ensureItem(Long userId,String session,String number,String question,String answer,String feedback,Integer score,List<Source> sources,Map<String,Integer> dims,long observedAt) {
        String id=InterviewLearningStore.hash(userId+"|"+question);
        var insert=new Update().setOnInsert("userId",userId).setOnInsert("sessionId",session).setOnInsert("questionNumber",number).setOnInsert("question",question).setOnInsert("answer",answer).setOnInsert("feedback",feedback).setOnInsert("latestScore",score).setOnInsert("favorite",false).setOnInsert("sources",sources).setOnInsert("dimensions",dims).setOnInsert("lastObservedAt",observedAt).setOnInsert("updatedAt",System.currentTimeMillis()).setOnInsert("policy",dims.size()==4?InterviewRubric.VERSION:"legacy");
        mongo.upsert(Query.query(Criteria.where("_id").is(id)),insert,StudyItem.class,"interview_study_item");
        if(score!=null) mongo.updateFirst(Query.query(Criteria.where("_id").is(id).and("lastObservedAt").lt(observedAt)),new Update().set("latestScore",score).set("answer",answer).set("feedback",feedback).set("dimensions",dims).set("lastObservedAt",observedAt).set("updatedAt",System.currentTimeMillis()).set("policy",dims.size()==4?InterviewRubric.VERSION:"legacy"),StudyItem.class,"interview_study_item");
        return ownedItem(id,userId);
    }
    public StudyItem ownedItem(String id,Long userId) {
        StudyItem value=mongo.findById(id,StudyItem.class,"interview_study_item");
        if(value==null || !Objects.equals(value.getUserId(),userId))throw new ClientException("练习条目不存在或无权访问");return value;
    }
    public List<StudyItem> items(Long userId,String filter) {
        Criteria c=Criteria.where("userId").is(userId);
        if("favorite".equals(filter))c=c.and("favorite").is(true);
        else if("wrong".equals(filter))c=c.and("latestScore").lt(60).ne(null);
        else if("weak".equals(filter))c=c.and("latestScore").lt(75).ne(null);
        return mongo.find(Query.query(c).with(Sort.by(Sort.Direction.DESC,"updatedAt")).limit(200),StudyItem.class,"interview_study_item");
    }
    public StudyItem favorite(String id,Long userId,boolean favorite) {
        ownedItem(id,userId);mongo.updateFirst(Query.query(Criteria.where("_id").is(id).and("userId").is(userId)),new Update().set("favorite",favorite),StudyItem.class,"interview_study_item");return ownedItem(id,userId);
    }
    public StudyItem favoriteBank(Long userId,long bankId) {
        Source source=store.bankSource(bankId);
        if(source==null)throw new ClientException("题目不存在或已移除");
        StudyItem item=ensureItem(userId,"",Long.toString(bankId),source.getContent(),"","",null,List.of(source),Map.of(),System.currentTimeMillis());
        return favorite(item.getId(),userId,true);
    }
    public List<org.bson.Document> history(Long userId) {
        var recent=recordMapper.selectList(Wrappers.<InterviewRecordDO>lambdaQuery().eq(InterviewRecordDO::getUserId,userId).eq(InterviewRecordDO::getDelFlag,0).orderByDesc(InterviewRecordDO::getCreateTime).last("LIMIT 20"));
        for(var record:recent) {if(mongo.findById(record.getSessionId(),org.bson.Document.class,"interview_learning_summary")==null)try{report(record.getSessionId(),userId);}catch(ClientException ignored){}}
        var values=mongo.find(Query.query(Criteria.where("userId").is(userId)).with(Sort.by(Sort.Direction.DESC,"date")).limit(20),org.bson.Document.class,"interview_learning_summary");
        values.forEach(v->{v.remove("_id");v.remove("userId");});return values;
    }
    public List<PracticeAttempt> attempts(String itemId,Long userId) {
        ownedItem(itemId,userId);return mongo.find(Query.query(Criteria.where("itemId").is(itemId).and("userId").is(userId).and("status").is("COMPLETED")).with(Sort.by(Sort.Direction.DESC,"createdAt")).limit(20),PracticeAttempt.class,"interview_practice_attempt");
    }
    public void applyAttempt(StudyItem item,String answer,JSONObject result,long time) {
        mongo.updateFirst(Query.query(Criteria.where("_id").is(item.getId()).and("userId").is(item.getUserId()).and("lastObservedAt").lt(time)),new Update().set("latestScore",result.getInteger("score")).set("answer",answer).set("feedback",result.getString("feedback")).set("dimensions",InterviewRubric.dimensions(result)).set("policy",result.getString("grading_policy")).set("lastObservedAt",time).set("updatedAt",time),StudyItem.class,"interview_study_item");
    }
}
