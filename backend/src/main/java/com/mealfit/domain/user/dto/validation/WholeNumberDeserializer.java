package com.mealfit.domain.user.dto.validation;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonToken;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonMappingException;
import java.io.IOException;

/** 나이·횟수·시간의 소수점을 자동으로 버리지 않고 잘못된 입력으로 거절합니다. */
public class WholeNumberDeserializer extends JsonDeserializer<Integer> {
    @Override
    public Integer deserialize(JsonParser parser, DeserializationContext context) throws IOException {
        if (parser.currentToken() != JsonToken.VALUE_NUMBER_INT)
            throw JsonMappingException.from(parser, "정수를 입력해 주세요.");
        return parser.getIntValue();
    }
}
