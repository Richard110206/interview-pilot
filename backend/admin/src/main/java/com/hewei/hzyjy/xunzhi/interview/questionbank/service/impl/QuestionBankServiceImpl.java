package com.hewei.hzyjy.xunzhi.interview.questionbank.service.impl;

import com.alibaba.fastjson2.JSON;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.hewei.hzyjy.xunzhi.common.convention.exception.ClientException;
import com.hewei.hzyjy.xunzhi.interview.questionbank.api.io.req.QuestionBankPageReqDTO;
import com.hewei.hzyjy.xunzhi.interview.questionbank.api.io.req.QuestionBankSaveReqDTO;
import com.hewei.hzyjy.xunzhi.interview.questionbank.api.io.resp.QuestionBankRespDTO;
import com.hewei.hzyjy.xunzhi.interview.questionbank.dao.entity.QuestionBankDO;
import com.hewei.hzyjy.xunzhi.interview.questionbank.dao.mapper.QuestionBankMapper;
import com.hewei.hzyjy.xunzhi.interview.questionbank.rag.QuestionBankRagService;
import com.hewei.hzyjy.xunzhi.interview.questionbank.rag.QuestionBankRagService.QuestionBankHit;
import com.hewei.hzyjy.xunzhi.interview.questionbank.service.QuestionBankService;
import cn.hutool.core.util.StrUtil;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class QuestionBankServiceImpl implements QuestionBankService {

    private static final Set<String> QUESTION_TYPES = Set.of("CONCEPT", "SCENARIO", "CODING", "PROJECT");

    private final QuestionBankMapper questionBankMapper;
    private final QuestionBankRagService questionBankRagService;

    @Override
    public Long saveOrUpdateQuestion(QuestionBankSaveReqDTO reqDTO) {
        if (!QUESTION_TYPES.contains(reqDTO.getQuestionType())) {
            throw new ClientException("题型必须是 CONCEPT、SCENARIO、CODING 或 PROJECT");
        }
        QuestionBankDO question = new QuestionBankDO();
        question.setId(reqDTO.getId());
        question.setCategory(reqDTO.getCategory().trim());
        question.setSkillTag(reqDTO.getSkillTag().trim());
        question.setDifficulty(reqDTO.getDifficulty());
        question.setQuestionType(reqDTO.getQuestionType());
        question.setQuestionText(reqDTO.getQuestionText().trim());
        question.setReferenceAnswer(StrUtil.nullToEmpty(reqDTO.getReferenceAnswer()));
        question.setScoringPoints(reqDTO.getScoringPoints() == null || reqDTO.getScoringPoints().isEmpty()
                ? null : JSON.toJSONString(reqDTO.getScoringPoints()));
        question.setStatus(reqDTO.getStatus());
        question.setSource(StrUtil.nullToEmpty(reqDTO.getSource()));
        question.setDelFlag(0);
        if (reqDTO.getId() == null) {
            questionBankMapper.insert(question);
        } else {
            QuestionBankDO existing = questionBankMapper.selectById(reqDTO.getId());
            if (existing == null || existing.getDelFlag() != 0) {
                throw new ClientException("题目不存在或已删除");
            }
            questionBankMapper.updateById(question);
        }
        // 向量索引同步失败只影响检索增强，不影响题目落库。
        questionBankRagService.indexQuestion(question);
        return question.getId();
    }

    @Override
    public IPage<QuestionBankRespDTO> pageQuestions(QuestionBankPageReqDTO reqDTO) {
        LambdaQueryWrapper<QuestionBankDO> wrapper = new LambdaQueryWrapper<QuestionBankDO>()
                .eq(QuestionBankDO::getDelFlag, 0)
                .eq(StrUtil.isNotBlank(reqDTO.getCategory()), QuestionBankDO::getCategory, reqDTO.getCategory())
                .eq(StrUtil.isNotBlank(reqDTO.getSkillTag()), QuestionBankDO::getSkillTag, reqDTO.getSkillTag())
                .eq(reqDTO.getDifficulty() != null, QuestionBankDO::getDifficulty, reqDTO.getDifficulty())
                .eq(reqDTO.getStatus() != null, QuestionBankDO::getStatus, reqDTO.getStatus())
                .like(StrUtil.isNotBlank(reqDTO.getKeyword()), QuestionBankDO::getQuestionText, reqDTO.getKeyword())
                .orderByDesc(QuestionBankDO::getUpdateTime);
        IPage<QuestionBankDO> page = questionBankMapper.selectPage(
                new Page<>(reqDTO.getPageNum(), reqDTO.getPageSize()), wrapper);
        return page.convert(this::toRespDTO);
    }

    @Override
    public QuestionBankRespDTO getQuestion(Long id) {
        QuestionBankDO question = requireExisting(id);
        return toRespDTO(question);
    }

    @Override
    public void updateStatus(Long id, Integer status) {
        if (status == null || (status != 0 && status != 1)) {
            throw new ClientException("状态取值不正确");
        }
        QuestionBankDO question = requireExisting(id);
        QuestionBankDO update = new QuestionBankDO();
        update.setId(id);
        update.setStatus(status);
        questionBankMapper.updateById(update);
        question.setStatus(status);
        questionBankRagService.indexQuestion(question);
    }

    @Override
    public void deleteQuestion(Long id) {
        requireExisting(id);
        QuestionBankDO update = new QuestionBankDO();
        update.setId(id);
        update.setDelFlag(1);
        questionBankMapper.updateById(update);
        questionBankRagService.removeQuestion(id);
    }

    @Override
    public List<QuestionBankHit> searchQuestions(String query, Integer topK) {
        if (StrUtil.isBlank(query)) {
            throw new ClientException("检索关键词不能为空");
        }
        return questionBankRagService.searchRelated(query, topK == null ? 0 : topK);
    }

    @Override
    public int rebuildIndex() {
        return questionBankRagService.rebuildIndex();
    }

    @Override
    public Map<String, Long> countByCategory() {
        Map<String, Long> counts = new LinkedHashMap<>();
        questionBankMapper.selectList(new LambdaQueryWrapper<QuestionBankDO>()
                        .eq(QuestionBankDO::getDelFlag, 0)
                        .eq(QuestionBankDO::getStatus, 1)
                        .orderByAsc(QuestionBankDO::getCategory))
                .forEach(question -> counts.merge(question.getCategory(), 1L, Long::sum));
        return counts;
    }

    @Override
    public Map<String, Long> countBySkillTag(String category) {
        Map<String, Long> counts = new LinkedHashMap<>();
        questionBankMapper.selectList(new LambdaQueryWrapper<QuestionBankDO>()
                        .eq(QuestionBankDO::getDelFlag, 0)
                        .eq(QuestionBankDO::getStatus, 1)
                        .eq(StrUtil.isNotBlank(category), QuestionBankDO::getCategory, category)
                        .orderByAsc(QuestionBankDO::getSkillTag))
                .forEach(question -> counts.merge(question.getSkillTag(), 1L, Long::sum));
        return counts.entrySet().stream()
                .sorted((a, b) -> Long.compare(b.getValue(), a.getValue()))
                .collect(LinkedHashMap::new, (map, entry) -> map.put(entry.getKey(), entry.getValue()), LinkedHashMap::putAll);
    }

    private QuestionBankDO requireExisting(Long id) {
        QuestionBankDO question = questionBankMapper.selectById(id);
        if (question == null || question.getDelFlag() != 0) {
            throw new ClientException("题目不存在或已删除");
        }
        return question;
    }

    private QuestionBankRespDTO toRespDTO(QuestionBankDO question) {
        QuestionBankRespDTO respDTO = new QuestionBankRespDTO();
        respDTO.setId(question.getId());
        respDTO.setCategory(question.getCategory());
        respDTO.setSkillTag(question.getSkillTag());
        respDTO.setDifficulty(question.getDifficulty());
        respDTO.setQuestionType(question.getQuestionType());
        respDTO.setQuestionText(question.getQuestionText());
        respDTO.setReferenceAnswer(question.getReferenceAnswer());
        respDTO.setScoringPoints(parseScoringPoints(question.getScoringPoints()));
        respDTO.setStatus(question.getStatus());
        respDTO.setSource(question.getSource());
        respDTO.setCreateTime(question.getCreateTime());
        respDTO.setUpdateTime(question.getUpdateTime());
        return respDTO;
    }

    private List<String> parseScoringPoints(String scoringPoints) {
        if (StrUtil.isBlank(scoringPoints)) {
            return List.of();
        }
        try {
            return JSON.parseArray(scoringPoints, String.class);
        } catch (Exception e) {
            return List.of();
        }
    }
}
