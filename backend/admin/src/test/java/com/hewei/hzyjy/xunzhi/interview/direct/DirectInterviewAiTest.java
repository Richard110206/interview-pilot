package com.hewei.hzyjy.xunzhi.interview.direct;

import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.JSONObject;
import com.hewei.hzyjy.xunzhi.agent.application.BusinessAgentScene;
import com.hewei.hzyjy.xunzhi.ai.dao.entity.AiPropertiesDO;
import com.hewei.hzyjy.xunzhi.ai.service.AiPropertiesService;
import com.hewei.hzyjy.xunzhi.common.convention.exception.ClientException;
import com.hewei.hzyjy.xunzhi.interview.knowledge.rag.KnowledgeRagService;
import com.hewei.hzyjy.xunzhi.interview.questionbank.rag.QuestionBankRagService;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.Test;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class DirectInterviewAiTest {
    @Test
    void optInUsesRealModelConfigurationAndDoesNotInventMissingBindings() {
        DirectInterviewProperties properties = new DirectInterviewProperties();
        AiPropertiesService models = mock(AiPropertiesService.class);
        DirectInterviewAi client = new DirectInterviewAi(properties, models, mock(LocalResumeStore.class),
                ragServiceMock(), knowledgeRagMock());
        assertNull(client.binding(BusinessAgentScene.INTERVIEW_QUESTION_ASKING));
        verifyNoInteractions(models);
        properties.setProvider("deepseek");
        assertThrows(ClientException.class, () -> client.binding(BusinessAgentScene.INTERVIEW_QUESTION_ASKING));
        assertThrows(ClientException.class, () -> client.binding(BusinessAgentScene.INTERVIEW_DEMEANOR));
        assertNull(client.binding(BusinessAgentScene.GENERAL_AGENT_CHAT));
    }

    @Test
    void sendsStructuredRequestWithContextAndRejectsInvalidScoresAndProviderFailures() throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        AtomicReference<JSONObject> received = new AtomicReference<>();
        AtomicReference<String> content = new AtomicReference<>("{\"score\":75,\"dimensions\":{\"accuracy\":75,\"completeness\":75,\"reasoning\":75,\"expression\":75},\"feedback\":\"应补充事务边界\",\"missing_points\":[],\"follow_up_needed\":false,\"follow_up_question\":\"\"}");
        server.createContext("/chat/completions", exchange -> {
            received.set(JSON.parseObject(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8)));
            byte[] response = JSON.toJSONBytes(Map.of("choices", List.of(Map.of("finish_reason", "stop", "message", Map.of("content", content.get())))));
            exchange.sendResponseHeaders(200, response.length);
            exchange.getResponseBody().write(response);
            exchange.close();
        });
        server.createContext("/fail/chat/completions", exchange -> {
            byte[] body = "private-provider-details".getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(402, body.length);
            exchange.getResponseBody().write(body);
            exchange.close();
        });
        server.start();
        try {
            DirectInterviewProperties properties = new DirectInterviewProperties();
            properties.setProvider("deepseek");
            AiPropertiesService models = mock(AiPropertiesService.class);
            AiPropertiesDO model = new AiPropertiesDO();
            model.setApiKey("unit-test-key");
            model.setApiUrl("http://127.0.0.1:" + server.getAddress().getPort());
            model.setModelName("test-model");
            when(models.getEnabledByAiType("deepseek")).thenReturn(model);
            QuestionBankRagService rag = ragServiceMock();
            KnowledgeRagService knowledge = knowledgeRagMock();
            DirectInterviewAi client = new DirectInterviewAi(properties, models, mock(LocalResumeStore.class),
                    rag, knowledge);
            var role = client.binding(BusinessAgentScene.INTERVIEW_ANSWER_EVALUATION);
            String result = client.complete(role, "回答", null, Map.of("question", "事务是什么"));
            assertEquals(75, JSON.parseObject(result).getIntValue("score"));
            verify(rag).searchRelated("事务是什么\n回答", 0);
            verify(knowledge).searchKnowledge("事务是什么\n回答", 0);
            when(rag.searchRelated(any(), anyInt())).thenThrow(new IllegalStateException("unavailable"));
            when(knowledge.searchKnowledge(any(), anyInt())).thenThrow(new IllegalStateException("unavailable"));
            assertEquals(75, JSON.parseObject(client.complete(role, "回答", null,
                    Map.of("question", "事务是什么"))).getIntValue("score"));
            assertEquals("json_object", received.get().getJSONObject("response_format").getString("type"));
            assertEquals("disabled", received.get().getJSONObject("thinking").getString("type"));
            assertTrue(received.get().getJSONArray("messages").getJSONObject(1).getString("content").contains("事务是什么"));
            content.set("{\"score\":101,\"feedback\":\"错误\",\"missing_points\":[],\"follow_up_needed\":false,\"follow_up_question\":\"\"}");
            assertThrows(ClientException.class, () -> client.complete(role, "回答", null, Map.of()));
            model.setApiUrl(model.getApiUrl() + "/fail");
            ClientException ex = assertThrows(ClientException.class, () -> client.complete(role, "回答", null, Map.of()));
            assertTrue(ex.getMessage().contains("402"));
            assertFalse(ex.getMessage().contains("private-provider-details"));
        } finally { server.stop(0); }
    }

    /** 直连出题依赖的题库 RAG 检索：单测中降级为空结果，等价于 RAG 未启用的回退路径。 */
    private static QuestionBankRagService ragServiceMock() {
        QuestionBankRagService rag = mock(QuestionBankRagService.class);
        when(rag.searchRelated(any(), anyInt())).thenReturn(List.of());
        return rag;
    }

    /** 知识库 RAG 检索：单测中同样降级为空结果。 */
    private static KnowledgeRagService knowledgeRagMock() {
        KnowledgeRagService rag = mock(KnowledgeRagService.class);
        when(rag.searchKnowledge(any(), anyInt())).thenReturn(List.of());
        return rag;
    }
}
