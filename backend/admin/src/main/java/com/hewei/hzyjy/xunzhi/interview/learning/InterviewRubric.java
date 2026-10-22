package com.hewei.hzyjy.xunzhi.interview.learning;

import com.alibaba.fastjson2.JSONObject;
import java.util.*;

/** Versioned text-answer rubric. No voice/demeanor axes, no invented legacy dimensions. */
public final class InterviewRubric {
    private InterviewRubric() { }
    public static final String VERSION = "text-v1";
    public static final Map<String, Integer> WEIGHTS;
    public static final Map<String, String> LABELS;
    static {
        var weights = new LinkedHashMap<String,Integer>();
        weights.put("accuracy",40); weights.put("completeness",30); weights.put("reasoning",20); weights.put("expression",10);
        WEIGHTS = Collections.unmodifiableMap(weights);
        LABELS = Map.of("accuracy","技术准确性","completeness","要点完整性","reasoning","分析与取舍","expression","表达清晰度");
    }
    public static Map<String,Integer> dimensions(JSONObject result) {
        Object raw = result.get("dimensions");
        if (!(raw instanceof Map<?,?> map)) return Map.of();
        var values = new LinkedHashMap<String,Integer>();
        for (String key : WEIGHTS.keySet()) {
            Object value = map.get(key);
            if (!(value instanceof Number n) || !Double.isFinite(n.doubleValue()) || n.doubleValue()!=n.intValue() || n.intValue()<0 || n.intValue()>100) return Map.of();
            values.put(key,n.intValue());
        }
        return values;
    }
    public static int weighted(Map<String,Integer> values) {
        if (!values.keySet().containsAll(WEIGHTS.keySet())) throw new IllegalArgumentException("Missing rubric dimensions");
        return (int)Math.round(WEIGHTS.entrySet().stream().mapToDouble(e -> values.get(e.getKey())*e.getValue()/100.0).sum());
    }
    public static void apply(JSONObject result) {
        Map<String,Integer> values = dimensions(result);
        if (values.isEmpty()) return; // Legacy workflow remains explicitly uncalibrated.
        if ("off_topic".equals(result.getString("relevance"))) {
            values.replaceAll((key,value)->Math.min(value,20));
        }
        result.put("dimensions",values);
        result.put("score",weighted(values));
        result.put("grading_policy",VERSION);
    }
}
