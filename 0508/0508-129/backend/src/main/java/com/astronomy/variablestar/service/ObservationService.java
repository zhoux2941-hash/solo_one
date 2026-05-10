package com.astronomy.variablestar.service;

import com.astronomy.variablestar.dto.ObservationRequestDTO;
import com.astronomy.variablestar.dto.ObservationResponseDTO;
import com.astronomy.variablestar.dto.LightCurveDataDTO;

import java.util.List;

public interface ObservationService {

    ObservationResponseDTO createObservation(ObservationRequestDTO request);

    List<ObservationResponseDTO> getObservationsByStar(Long starId);

    LightCurveDataDTO getLightCurveData(Long starId);

    byte[] exportObservationsToCsv(Long starId);

    void clearLightCurveCache(Long starId);
}
