package com.hewei.hzyjy.xunzhi.interview.questionbank.rag;

import com.hewei.hzyjy.xunzhi.interview.questionbank.dao.entity.QuestionBankDO;
import com.hewei.hzyjy.xunzhi.interview.questionbank.dao.mapper.QuestionBankMapper;
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.output.Response;
import dev.langchain4j.store.embedding.EmbeddingStore;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
import static org.mockito.Mockito.*;

class QuestionBankRagServiceTest {
    @Test
    @SuppressWarnings("unchecked")
    void editingAndDisablingUseTheSamePersistentDocumentId() {
        var properties = new QuestionBankRagProperties();
        properties.setEnabled(true);
        var model = mock(EmbeddingModel.class);
        EmbeddingStore<TextSegment> store = mock(EmbeddingStore.class);
        ObjectProvider<EmbeddingModel> models = mock(ObjectProvider.class);
        ObjectProvider<EmbeddingStore<TextSegment>> stores = mock(ObjectProvider.class);
        when(models.getIfAvailable()).thenReturn(model);
        when(models.getObject()).thenReturn(model);
        when(stores.getIfAvailable()).thenReturn(store);
        when(stores.getObject()).thenReturn(store);
        when(model.embed(anyString())).thenReturn(Response.from(Embedding.from(new float[] {1, 0})));
        var service = new QuestionBankRagService(properties, mock(QuestionBankMapper.class), models, stores);
        var question = new QuestionBankDO();
        question.setId(42L);
        question.setCategory("Frontend");
        question.setSkillTag("JavaScript");
        question.setDifficulty(3);
        question.setStatus(1);
        question.setQuestionText("Explain the event loop");
        service.indexQuestion(question);
        question.setQuestionText("Explain event loop microtasks");
        service.indexQuestion(question);
        verify(store, times(2)).addAll(eq(List.of("42")), anyList(), anyList());
        verify(store, never()).add(any(Embedding.class), any(TextSegment.class));
        question.setStatus(0);
        service.indexQuestion(question);
        verify(store).remove("42");
        verify(model, times(2)).embed(anyString());
    }
}
