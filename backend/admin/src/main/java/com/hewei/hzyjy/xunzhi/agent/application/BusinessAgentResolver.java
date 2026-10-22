package com.hewei.hzyjy.xunzhi.agent.application;

import cn.hutool.core.util.StrUtil;
import com.hewei.hzyjy.xunzhi.agent.dao.entity.AgentPropertiesDO;
import com.hewei.hzyjy.xunzhi.common.convention.exception.ClientException;
import com.hewei.hzyjy.xunzhi.common.enums.InterviewErrorCodeEnum;
import com.hewei.hzyjy.xunzhi.toolkit.xunfei.AgentPropertiesLoader;
import com.hewei.hzyjy.xunzhi.interview.direct.DirectInterviewAi;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.LinkedHashSet;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class BusinessAgentResolver {

    private final BusinessAgentBindingProperties bindingProperties;
    private final AgentPropertiesLoader agentPropertiesLoader;
    private final DirectInterviewAi directInterviewAi;

    public AgentPropertiesDO resolveRequired(BusinessAgentScene scene) {
        AgentPropertiesDO directRole = directInterviewAi.binding(scene);
        if (directRole != null) return directRole;
        Set<String> candidateAgentNames = new LinkedHashSet<>();
        String configuredAgentName = bindingProperties.resolveAgentName(scene);
        if (StrUtil.isNotBlank(configuredAgentName)) {
            candidateAgentNames.add(configuredAgentName.trim());
        }
        candidateAgentNames.addAll(scene.getCandidateAgentNames());

        for (String candidateAgentName : candidateAgentNames) {
            AgentPropertiesDO agentProperties = agentPropertiesLoader.getByAgentName(candidateAgentName);
            if (agentProperties != null) {
                if (StrUtil.isNotBlank(configuredAgentName) && !configuredAgentName.trim().equals(candidateAgentName)) {
                    log.warn(
                            "Configured agent not found, fallback matched scene={}, configuredName={}, matchedName={}, agentId={}",
                            scene.getCode(),
                            configuredAgentName,
                            candidateAgentName,
                            agentProperties.getId()
                    );
                } else {
                    log.info("Resolved business agent scene={}, agentName={}, agentId={}",
                            scene.getCode(), candidateAgentName, agentProperties.getId());
                }
                return agentProperties;
            }
        }

        log.error("No agent configuration found for scene={}, candidateNames={}", scene.getCode(), candidateAgentNames);
        throw new ClientException(
                "agent binding not found for scene=" + scene.getCode() + ", candidateNames=" + candidateAgentNames,
                InterviewErrorCodeEnum.AGENT_CONFIG_NOT_FOUND
        );
    }
}
