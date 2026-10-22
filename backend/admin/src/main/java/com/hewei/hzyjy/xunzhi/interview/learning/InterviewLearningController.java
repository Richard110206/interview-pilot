package com.hewei.hzyjy.xunzhi.interview.learning;

import com.alibaba.fastjson2.*;
import com.hewei.hzyjy.xunzhi.agent.application.BusinessAgentScene;
import com.hewei.hzyjy.xunzhi.common.convention.annotation.CurrentUser;
import com.hewei.hzyjy.xunzhi.common.convention.context.UserContext;
import com.hewei.hzyjy.xunzhi.common.convention.exception.ClientException;
import com.hewei.hzyjy.xunzhi.common.convention.result.*;
import com.hewei.hzyjy.xunzhi.interview.direct.DirectInterviewAi;
import com.hewei.hzyjy.xunzhi.interview.shared.InterviewAiInvoker;
import com.hewei.hzyjy.xunzhi.interview.application.guard.core.InterviewAiGuardStage;
import com.hewei.hzyjy.xunzhi.interview.learning.InterviewLearningService.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.query.*;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController @RequestMapping("/api/xunzhi/v1/interview") @RequiredArgsConstructor
public class InterviewLearningController {
    private final InterviewLearningService learning;
    private final MongoTemplate mongo;
    private final InterviewAiInvoker invoker;
    private final DirectInterviewAi direct;
    @GetMapping("/sessions/{sessionId}/insights")
    public Result<Map<String,Object>> insights(@PathVariable String sessionId,@CurrentUser UserContext user){return Results.success(learning.report(sessionId,user.getUserId()));}
    @GetMapping("/learning/items")
    public Result<List<StudyItem>> items(@RequestParam(defaultValue="weak") String filter,@CurrentUser UserContext user){return Results.success(learning.items(user.getUserId(),filter));}
    @GetMapping("/learning/items/{id}")
    public Result<StudyItem> item(@PathVariable String id,@CurrentUser UserContext user){return Results.success(learning.ownedItem(id,user.getUserId()));}
    @GetMapping("/learning/history")
    public Result<List<org.bson.Document>> history(@CurrentUser UserContext user){return Results.success(learning.history(user.getUserId()));}
    public record FavoriteRequest(boolean favorite){}
    @PostMapping("/learning/question-bank/{bankId}/favorite")
    public Result<StudyItem> favoriteBank(@PathVariable long bankId,@CurrentUser UserContext user){return Results.success(learning.favoriteBank(user.getUserId(),bankId));}
    @PutMapping("/learning/items/{id}/favorite")
    public Result<StudyItem> favorite(@PathVariable String id,@RequestBody FavoriteRequest request,@CurrentUser UserContext user){return Results.success(learning.favorite(id,user.getUserId(),request.favorite()));}
    @GetMapping("/learning/items/{id}/attempts")
    public Result<List<PracticeAttempt>> attempts(@PathVariable String id,@CurrentUser UserContext user){return Results.success(learning.attempts(id,user.getUserId()));}
    public record AttemptRequest(String answer,String requestId){}
    @PostMapping("/learning/items/{id}/attempts")
    public Result<JSONObject> attempt(@PathVariable String id,@RequestBody AttemptRequest request,@CurrentUser UserContext user) throws Exception {
        StudyItem item=learning.ownedItem(id,user.getUserId());
        if(request.answer()==null || request.answer().isBlank() || request.answer().length()>12000 || request.requestId()==null || request.requestId().isBlank() || request.requestId().length()>100)throw new ClientException("请填写回答，并使用有效请求编号");
        String attemptId=InterviewLearningStore.hash(user.getUserId()+"|"+id+"|"+request.requestId());
        String hash=InterviewLearningStore.hash(request.answer());
        var query=Query.query(Criteria.where("_id").is(attemptId));
        long now=System.currentTimeMillis();
        var prior=mongo.findAndModify(query,new Update().setOnInsert("userId",user.getUserId()).setOnInsert("itemId",id).setOnInsert("answerHash",hash).setOnInsert("status","PROCESSING").setOnInsert("createdAt",now),FindAndModifyOptions.options().upsert(true),PracticeAttempt.class,"interview_practice_attempt");
        if(prior!=null){
            if(!hash.equals(prior.getAnswerHash()))throw new ClientException("同一请求编号不能用于不同回答");
            if("COMPLETED".equals(prior.getStatus())) {var result=JSON.parseObject(prior.getResultJson());learning.applyAttempt(item,request.answer(),result,prior.getCreatedAt());return Results.success(result);}
            boolean expired="PROCESSING".equals(prior.getStatus()) && prior.getCreatedAt()<now-120000;
            if(!"FAILED".equals(prior.getStatus()) && !expired)throw new ClientException("本次练习正在评分，请稍后用同一请求重试");
            var claimed=mongo.findAndModify(Query.query(Criteria.where("_id").is(attemptId).and("status").is(prior.getStatus()).and("createdAt").is(prior.getCreatedAt())),new Update().set("status","PROCESSING").set("createdAt",now),PracticeAttempt.class,"interview_practice_attempt");
            if(claimed==null)throw new ClientException("本次练习正在处理，请稍后重试");
        }
        try {
            var role=direct.binding(BusinessAgentScene.INTERVIEW_ANSWER_EVALUATION);
            if(role==null)throw new ClientException("专项练习需要启用文字评分服务");
            Map<String,Object> params=new LinkedHashMap<>();params.put("question",item.getQuestion());params.put("AGENT_USER_INPUT",request.answer());params.put("resume_context","专项再练习；以题目本身评估，不假设候选人经历");params.put("session_id","practice-"+attemptId);params.put("question_number","1");
            params.put("source_snapshots",item.getSources()==null?List.of():item.getSources());
            String raw=invoker.callAiSyncWithParameters("practice-"+attemptId,role,params,InterviewAiGuardStage.INTERVIEW_EVALUATION,"practice|"+attemptId+"|"+hash);
            JSONObject result=JSON.parseObject(raw);
            if(InterviewRubric.dimensions(result).size()!=4)throw new ClientException("评分维度不完整，请用同一请求重试");
            InterviewRubric.apply(result);
            result.put("previousScore",item.getLatestScore());result.put("recordedAt",now);
            mongo.updateFirst(query,new Update().set("status","COMPLETED").set("resultJson",result.toJSONString()),PracticeAttempt.class,"interview_practice_attempt");
            learning.applyAttempt(item,request.answer(),result,now);
            return Results.success(result);
        } catch(Exception ex){
            mongo.updateFirst(Query.query(Criteria.where("_id").is(attemptId).and("status").is("PROCESSING")),new Update().set("status","FAILED"),PracticeAttempt.class,"interview_practice_attempt");throw ex;
        }
    }
}
