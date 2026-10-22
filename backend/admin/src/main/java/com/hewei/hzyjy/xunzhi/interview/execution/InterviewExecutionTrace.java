package com.hewei.hzyjy.xunzhi.interview.execution;

import com.alibaba.fastjson2.JSON;
import java.time.Duration;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

/** Session-scoped operational facts only: no resume, answer, prompt, credential or model reasoning. */
@Service
@RequiredArgsConstructor
@Slf4j
public class InterviewExecutionTrace {
    private final StringRedisTemplate redis;
    @org.springframework.beans.factory.annotation.Autowired(required=false)
    private org.springframework.data.mongodb.core.MongoTemplate mongo;
    public record Span(String id, String sessionId, String stage, String label, String tool, long startedAt) { }
    public record Event(String id, String stage, String label, String tool, String status,
                        long startedAt, Long durationMs, Integer count, List<String> references, String summary) { }
    public Span start(String sessionId, String stage, String label, String tool) {
        if (sessionId == null || sessionId.isBlank()) return null;
        Span span = new Span(UUID.randomUUID().toString(), sessionId, stage, label, tool, System.currentTimeMillis());
        append(span.sessionId(), new Event(span.id(), stage, label, tool, "RUNNING", span.startedAt(), null, null, List.of(), ""));
        return span;
    }
    public void finish(Span span, String status, Integer count, List<String> references, String summary) {
        if (span == null) return;
        append(span.sessionId(), new Event(span.id(), span.stage(), span.label(), span.tool(), status,
                span.startedAt(), Math.max(0, System.currentTimeMillis() - span.startedAt()), count,
                references == null ? List.of() : references.stream().limit(8).toList(), summary));
    }
    public List<Event> read(String sessionId) {
        try {
            List<String> values = redis.opsForList().range(key(sessionId), 0, 149);
            if (values != null && !values.isEmpty()) return values.stream().map(value -> JSON.parseObject(value, Event.class)).toList();
        } catch (Exception ignored) { }
        if(mongo!=null)try {
            var query=org.springframework.data.mongodb.core.query.Query.query(org.springframework.data.mongodb.core.query.Criteria.where("sessionId").is(sessionId)).with(org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC,"startedAt")).limit(150);
            return mongo.find(query,org.bson.Document.class,"interview_execution_event").stream().map(doc->JSON.parseObject(JSON.toJSONString(doc),Event.class)).toList();
        } catch(Exception ignored){}
        return List.of();
    }
    private void append(String sessionId, Event event) {
        try {
            redis.opsForList().leftPush(key(sessionId), JSON.toJSONString(event));
            redis.opsForList().trim(key(sessionId), 0, 149);
            redis.expire(key(sessionId), Duration.ofDays(1));
        } catch (Exception ex) { log.debug("Execution trace unavailable for session {}", sessionId); }
        if(mongo!=null)try {
            var doc=org.bson.Document.parse(JSON.toJSONString(event));doc.put("_id",sessionId+":"+event.id());doc.put("sessionId",sessionId);mongo.save(doc,"interview_execution_event");
        }catch(Exception ex){log.debug("Durable execution trace unavailable for session {}",sessionId);}
    }
    private String key(String sessionId) { return "interview:execution:" + sessionId; }
}
