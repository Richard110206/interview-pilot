package com.hewei.hzyjy.xunzhi.ai.service.impl;

import com.hewei.hzyjy.xunzhi.ai.api.io.resp.AiPropertiesRespDTO;
import org.junit.jupiter.api.Test;
import java.util.List;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.spy;

class AiPropertiesServiceImplOptionsTest {
    @Test
    void mapsStoredProviderNamesToFrontendCodes() {
        AiPropertiesServiceImpl service = spy(new AiPropertiesServiceImpl());
        AiPropertiesRespDTO deepseek = new AiPropertiesRespDTO();
        deepseek.setAiType("deepseek");
        AiPropertiesRespDTO legacySpark = new AiPropertiesRespDTO();
        legacySpark.setAiType("generalv3.5");
        doReturn(List.of(deepseek, legacySpark)).when(service).getAllEnabledAiProperties();
        var options = service.getAvailableAiModels();
        assertEquals(4, options.get(0).getAiType());
        assertEquals(3, options.get(1).getAiType());
    }
}
