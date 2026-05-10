package com.disaster.relief.service;

import com.disaster.relief.dto.*;
import com.disaster.relief.entity.Warehouse;
import com.disaster.relief.repository.WarehouseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class AllocationService {

    private final WarehouseRepository warehouseRepository;

    public AllocationResult allocate(AllocationRequest request) {
        List<Warehouse> warehouses = warehouseRepository.findAll();
        if (warehouses.isEmpty()) {
            warehouses = getDefaultWarehouses();
        }

        String algorithm = request.getAlgorithm() != null ? request.getAlgorithm().toUpperCase() : "GREEDY";

        if ("GENETIC".equals(algorithm)) {
            return geneticAlgorithmAllocation(request, warehouses);
        }
        return greedyAllocation(request, warehouses);
    }

    private AllocationResult greedyAllocation(AllocationRequest request, List<Warehouse> warehouses) {
        List<PointAllocation> allocations = new ArrayList<>();
        
        SupplyRequirement totalReq = request.getTotalRequirement();
        if (totalReq == null) {
            totalReq = calculateTotalRequirement(request.getReliefPoints());
        }

        int totalTent = totalReq.getTentQuantity();
        int totalWater = totalReq.getWaterQuantity();
        int totalFood = totalReq.getFoodQuantity();
        int totalMedical = totalReq.getMedicalKitQuantity();

        int availableTent = warehouses.stream().mapToInt(Warehouse::getTentStock).sum();
        int availableWater = warehouses.stream().mapToInt(Warehouse::getWaterStock).sum();
        int availableFood = warehouses.stream().mapToInt(Warehouse::getFoodStock).sum();
        int availableMedical = warehouses.stream().mapToInt(Warehouse::getMedicalKitStock).sum();

        List<ReliefPoint> sortedPoints = new ArrayList<>(request.getReliefPoints());
        sortedPoints.sort((a, b) -> {
            int priorityCompare = Double.compare(b.getPriority(), a.getPriority());
            if (priorityCompare != 0) return priorityCompare;
            
            int popCompare = Integer.compare(b.getAffectedPopulation(), a.getAffectedPopulation());
            if (popCompare != 0) return popCompare;
            
            Warehouse wa = findNearestWarehouse(a, warehouses);
            Warehouse wb = findNearestWarehouse(b, warehouses);
            double distA = calculateDistance(a, wa);
            double distB = calculateDistance(b, wb);
            
            return Double.compare(distA, distB);
        });

        List<PointAllocation> tempAllocations = new ArrayList<>();
        int totalAllocatedTent = 0, totalAllocatedWater = 0;
        int totalAllocatedFood = 0, totalAllocatedMedical = 0;
        double totalCost = 0;

        for (ReliefPoint point : sortedPoints) {
            SupplyRequirement pointReq = calculatePointRequirement(point);
            Warehouse nearestWarehouse = findNearestWarehouse(point, warehouses);
            double distance = calculateDistance(point, nearestWarehouse);

            tempAllocations.add(PointAllocation.builder()
                .pointId(point.getId())
                .pointName(point.getName())
                .distance(distance)
                .requested(pointReq)
                .build());
        }

        double tentRatio = totalTent > 0 ? Math.min(1.0, (double) availableTent / totalTent) : 1.0;
        double waterRatio = totalWater > 0 ? Math.min(1.0, (double) availableWater / totalWater) : 1.0;
        double foodRatio = totalFood > 0 ? Math.min(1.0, (double) availableFood / totalFood) : 1.0;
        double medicalRatio = totalMedical > 0 ? Math.min(1.0, (double) availableMedical / totalMedical) : 1.0;

        if (tentRatio < 1.0 || waterRatio < 1.0 || foodRatio < 1.0 || medicalRatio < 1.0) {
            int remainingTent = availableTent;
            int remainingWater = availableWater;
            int remainingFood = availableFood;
            int remainingMedical = availableMedical;

            for (int i = 0; i < tempAllocations.size(); i++) {
                PointAllocation pa = tempAllocations.get(i);
                SupplyRequirement req = pa.getRequested();
                boolean isLast = (i == tempAllocations.size() - 1);

                int allocatedTent, allocatedWater, allocatedFood, allocatedMedical;

                if (isLast) {
                    allocatedTent = Math.min(req.getTentQuantity(), remainingTent);
                    allocatedWater = Math.min(req.getWaterQuantity(), remainingWater);
                    allocatedFood = Math.min(req.getFoodQuantity(), remainingFood);
                    allocatedMedical = Math.min(req.getMedicalKitQuantity(), remainingMedical);
                } else {
                    double priorityWeight = (double) req.getTentQuantity() / totalTent;
                    double fairShareTent = (int) Math.ceil(availableTent * priorityWeight);
                    allocatedTent = Math.min(req.getTentQuantity(), Math.min(fairShareTent, remainingTent));

                    priorityWeight = (double) req.getWaterQuantity() / totalWater;
                    double fairShareWater = (int) Math.ceil(availableWater * priorityWeight);
                    allocatedWater = Math.min(req.getWaterQuantity(), Math.min(fairShareWater, remainingWater));

                    priorityWeight = (double) req.getFoodQuantity() / totalFood;
                    double fairShareFood = (int) Math.ceil(availableFood * priorityWeight);
                    allocatedFood = Math.min(req.getFoodQuantity(), Math.min(fairShareFood, remainingFood));

                    priorityWeight = (double) req.getMedicalKitQuantity() / totalMedical;
                    double fairShareMedical = (int) Math.ceil(availableMedical * priorityWeight);
                    allocatedMedical = Math.min(req.getMedicalKitQuantity(), Math.min(fairShareMedical, remainingMedical));
                }

                remainingTent -= allocatedTent;
                remainingWater -= allocatedWater;
                remainingFood -= allocatedFood;
                remainingMedical -= allocatedMedical;

                double pointSatisfaction = calculateSatisfaction(
                    allocatedTent, allocatedWater, allocatedFood, allocatedMedical,
                    req.getTentQuantity(), req.getWaterQuantity(), 
                    req.getFoodQuantity(), req.getMedicalKitQuantity()
                );

                totalCost += pa.getDistance() * (allocatedTent + allocatedWater + allocatedFood + allocatedMedical);
                totalAllocatedTent += allocatedTent;
                totalAllocatedWater += allocatedWater;
                totalAllocatedFood += allocatedFood;
                totalAllocatedMedical += allocatedMedical;

                allocations.add(PointAllocation.builder()
                    .pointId(pa.getPointId())
                    .pointName(pa.getPointName())
                    .distance(pa.getDistance())
                    .allocated(SupplyRequirement.builder()
                        .tentQuantity(allocatedTent)
                        .waterQuantity(allocatedWater)
                        .foodQuantity(allocatedFood)
                        .medicalKitQuantity(allocatedMedical)
                        .build())
                    .requested(req)
                    .satisfactionRate(pointSatisfaction)
                    .build());
            }
        } else {
            for (PointAllocation pa : tempAllocations) {
                SupplyRequirement req = pa.getRequested();
                int allocatedTent = req.getTentQuantity();
                int allocatedWater = req.getWaterQuantity();
                int allocatedFood = req.getFoodQuantity();
                int allocatedMedical = req.getMedicalKitQuantity();

                totalCost += pa.getDistance() * (allocatedTent + allocatedWater + allocatedFood + allocatedMedical);
                totalAllocatedTent += allocatedTent;
                totalAllocatedWater += allocatedWater;
                totalAllocatedFood += allocatedFood;
                totalAllocatedMedical += allocatedMedical;

                allocations.add(PointAllocation.builder()
                    .pointId(pa.getPointId())
                    .pointName(pa.getPointName())
                    .distance(pa.getDistance())
                    .allocated(SupplyRequirement.builder()
                        .tentQuantity(allocatedTent)
                        .waterQuantity(allocatedWater)
                        .foodQuantity(allocatedFood)
                        .medicalKitQuantity(allocatedMedical)
                        .build())
                    .requested(req)
                    .satisfactionRate(1.0)
                    .build());
            }
        }

        double totalSatisfaction = calculateSatisfaction(
            totalAllocatedTent, totalAllocatedWater, totalAllocatedFood, totalAllocatedMedical,
            totalTent, totalWater, totalFood, totalMedical
        );

        return AllocationResult.builder()
            .algorithm("GREEDY")
            .totalCost(totalCost)
            .satisfactionRate(totalSatisfaction)
            .allocations(allocations)
            .unmetRequirements(SupplyRequirement.builder()
                .tentQuantity(Math.max(0, totalTent - totalAllocatedTent))
                .waterQuantity(Math.max(0, totalWater - totalAllocatedWater))
                .foodQuantity(Math.max(0, totalFood - totalAllocatedFood))
                .medicalKitQuantity(Math.max(0, totalMedical - totalAllocatedMedical))
                .build())
            .metrics(Map.of(
                "warehousesUsed", warehouses.size(),
                "pointsServed", allocations.size(),
                "fairAllocation", true
            ))
            .build();
    }

    private AllocationResult geneticAlgorithmAllocation(AllocationRequest request, List<Warehouse> warehouses) {
        List<PointAllocation> allocations = new ArrayList<>();
        
        SupplyRequirement totalReq = request.getTotalRequirement();
        if (totalReq == null) {
            totalReq = calculateTotalRequirement(request.getReliefPoints());
        }

        int availableTent = warehouses.stream().mapToInt(Warehouse::getTentStock).sum();
        int availableWater = warehouses.stream().mapToInt(Warehouse::getWaterStock).sum();
        int availableFood = warehouses.stream().mapToInt(Warehouse::getFoodStock).sum();
        int availableMedical = warehouses.stream().mapToInt(Warehouse::getMedicalKitStock).sum();

        int populationSize = 50;
        int generations = 100;
        double mutationRate = 0.1;

        List<double[]> population = initializePopulation(populationSize, request.getReliefPoints().size());

        double bestFitness = -1;
        double[] bestSolution = null;

        for (int gen = 0; gen < generations; gen++) {
            List<Double> fitnesses = new ArrayList<>();
            for (double[] individual : population) {
                double fitness = evaluateFitnessWithConstraints(individual, request, warehouses, 
                    availableTent, availableWater, availableFood, availableMedical);
                fitnesses.add(fitness);
                if (fitness > bestFitness) {
                    bestFitness = fitness;
                    bestSolution = individual.clone();
                }
            }

            List<double[]> newPopulation = new ArrayList<>();
            for (int i = 0; i < populationSize; i++) {
                double[] parent1 = selectParent(population, fitnesses);
                double[] parent2 = selectParent(population, fitnesses);
                double[] child = crossover(parent1, parent2);
                if (Math.random() < mutationRate) {
                    mutate(child);
                }
                newPopulation.add(child);
            }
            population = newPopulation;
        }

        return buildResultFromSolutionWithConstraints(bestSolution, request, warehouses, totalReq,
            availableTent, availableWater, availableFood, availableMedical);
    }

    private List<double[]> initializePopulation(int size, int numPoints) {
        List<double[]> population = new ArrayList<>();
        Random random = new Random();
        for (int i = 0; i < size; i++) {
            double[] individual = new double[numPoints * 4];
            for (int j = 0; j < individual.length; j++) {
                individual[j] = random.nextDouble();
            }
            population.add(individual);
        }
        return population;
    }

    private double evaluateFitness(double[] individual, AllocationRequest request, List<Warehouse> warehouses) {
        double satisfactionScore = 0;
        double costPenalty = 0;

        for (int i = 0; i < request.getReliefPoints().size(); i++) {
            ReliefPoint point = request.getReliefPoints().get(i);
            SupplyRequirement req = calculatePointRequirement(point);

            double tentRatio = individual[i * 4];
            double waterRatio = individual[i * 4 + 1];
            double foodRatio = individual[i * 4 + 2];
            double medicalRatio = individual[i * 4 + 3];

            satisfactionScore += (tentRatio + waterRatio + foodRatio + medicalRatio) / 4 * point.getPriority();

            Warehouse nearest = findNearestWarehouse(point, warehouses);
            costPenalty += calculateDistance(point, nearest) * 0.01;
        }

        return satisfactionScore - costPenalty * 0.1;
    }

    private double evaluateFitnessWithConstraints(double[] individual, AllocationRequest request, 
                                                    List<Warehouse> warehouses,
                                                    int availableTent, int availableWater,
                                                    int availableFood, int availableMedical) {
        double satisfactionScore = 0;
        double costPenalty = 0;
        double overAllocationPenalty = 0;

        int totalTent = 0, totalWater = 0, totalFood = 0, totalMedical = 0;
        List<Double> individualRatios = new ArrayList<>();

        for (int i = 0; i < request.getReliefPoints().size(); i++) {
            ReliefPoint point = request.getReliefPoints().get(i);
            SupplyRequirement req = calculatePointRequirement(point);

            double tentRatio = Math.min(1.0, individual[i * 4]);
            double waterRatio = Math.min(1.0, individual[i * 4 + 1]);
            double foodRatio = Math.min(1.0, individual[i * 4 + 2]);
            double medicalRatio = Math.min(1.0, individual[i * 4 + 3]);

            individualRatios.add(tentRatio);
            individualRatios.add(waterRatio);
            individualRatios.add(foodRatio);
            individualRatios.add(medicalRatio);

            totalTent += req.getTentQuantity() * tentRatio;
            totalWater += req.getWaterQuantity() * waterRatio;
            totalFood += req.getFoodQuantity() * foodRatio;
            totalMedical += req.getMedicalKitQuantity() * medicalRatio;

            satisfactionScore += (tentRatio + waterRatio + foodRatio + medicalRatio) / 4 * point.getPriority();

            Warehouse nearest = findNearestWarehouse(point, warehouses);
            costPenalty += calculateDistance(point, nearest) * 0.01;
        }

        if (totalTent > availableTent) {
            overAllocationPenalty += (totalTent - availableTent) * 100;
        }
        if (totalWater > availableWater) {
            overAllocationPenalty += (totalWater - availableWater) * 10;
        }
        if (totalFood > availableFood) {
            overAllocationPenalty += (totalFood - availableFood) * 10;
        }
        if (totalMedical > availableMedical) {
            overAllocationPenalty += (totalMedical - availableMedical) * 100;
        }

        double fairnessScore = calculateFairnessScore(individualRatios, request.getReliefPoints().size());

        return satisfactionScore * 100 + fairnessScore * 50 - costPenalty - overAllocationPenalty;
    }

    private double calculateFairnessScore(List<Double> ratios, int numPoints) {
        if (numPoints == 0) return 1.0;

        double[] pointAvgRatios = new double[numPoints];
        for (int i = 0; i < numPoints; i++) {
            pointAvgRatios[i] = (ratios.get(i * 4) + ratios.get(i * 4 + 1) + 
                                  ratios.get(i * 4 + 2) + ratios.get(i * 4 + 3)) / 4.0;
        }

        double mean = 0;
        for (double r : pointAvgRatios) {
            mean += r;
        }
        mean /= numPoints;

        if (mean == 0) return 0;

        double variance = 0;
        for (double r : pointAvgRatios) {
            variance += Math.pow(r - mean, 2);
        }
        variance /= numPoints;
        double stdDev = Math.sqrt(variance);

        double cv = stdDev / mean;
        return Math.max(0, 1 - cv);
    }

    private double[] selectParent(List<double[]> population, List<Double> fitnesses) {
        double totalFitness = fitnesses.stream().mapToDouble(Double::doubleValue).sum();
        double random = Math.random() * totalFitness;
        double cumulative = 0;
        for (int i = 0; i < population.size(); i++) {
            cumulative += fitnesses.get(i);
            if (cumulative >= random) {
                return population.get(i);
            }
        }
        return population.get(population.size() - 1);
    }

    private double[] crossover(double[] parent1, double[] parent2) {
        double[] child = new double[parent1.length];
        int crossoverPoint = new Random().nextInt(parent1.length);
        for (int i = 0; i < parent1.length; i++) {
            child[i] = i < crossoverPoint ? parent1[i] : parent2[i];
        }
        return child;
    }

    private void mutate(double[] individual) {
        Random random = new Random();
        int idx = random.nextInt(individual.length);
        individual[idx] = random.nextDouble();
    }

    private AllocationResult buildResultFromSolution(double[] solution, AllocationRequest request, 
                                                      List<Warehouse> warehouses, SupplyRequirement totalReq) {
        List<PointAllocation> allocations = new ArrayList<>();
        double totalCost = 0;

        int totalAllocatedTent = 0, totalAllocatedWater = 0;
        int totalAllocatedFood = 0, totalAllocatedMedical = 0;

        for (int i = 0; i < request.getReliefPoints().size(); i++) {
            ReliefPoint point = request.getReliefPoints().get(i);
            SupplyRequirement req = calculatePointRequirement(point);

            int tent = (int) Math.ceil(req.getTentQuantity() * Math.min(1, solution[i * 4]));
            int water = (int) Math.ceil(req.getWaterQuantity() * Math.min(1, solution[i * 4 + 1]));
            int food = (int) Math.ceil(req.getFoodQuantity() * Math.min(1, solution[i * 4 + 2]));
            int medical = (int) Math.ceil(req.getMedicalKitQuantity() * Math.min(1, solution[i * 4 + 3]));

            totalAllocatedTent += tent;
            totalAllocatedWater += water;
            totalAllocatedFood += food;
            totalAllocatedMedical += medical;

            Warehouse nearest = findNearestWarehouse(point, warehouses);
            double distance = calculateDistance(point, nearest);
            totalCost += distance * (tent + water + food + medical);

            double satisfaction = calculateSatisfaction(tent, water, food, medical,
                req.getTentQuantity(), req.getWaterQuantity(), req.getFoodQuantity(), req.getMedicalKitQuantity());

            allocations.add(PointAllocation.builder()
                .pointId(point.getId())
                .pointName(point.getName())
                .distance(distance)
                .allocated(SupplyRequirement.builder()
                    .tentQuantity(tent).waterQuantity(water)
                    .foodQuantity(food).medicalKitQuantity(medical).build())
                .requested(req)
                .satisfactionRate(satisfaction)
                .build());
        }

        double totalSatisfaction = calculateSatisfaction(
            totalAllocatedTent, totalAllocatedWater, totalAllocatedFood, totalAllocatedMedical,
            totalReq.getTentQuantity(), totalReq.getWaterQuantity(),
            totalReq.getFoodQuantity(), totalReq.getMedicalKitQuantity()
        );

        return AllocationResult.builder()
            .algorithm("GENETIC")
            .totalCost(totalCost)
            .satisfactionRate(totalSatisfaction)
            .allocations(allocations)
            .unmetRequirements(SupplyRequirement.builder()
                .tentQuantity(Math.max(0, totalReq.getTentQuantity() - totalAllocatedTent))
                .waterQuantity(Math.max(0, totalReq.getWaterQuantity() - totalAllocatedWater))
                .foodQuantity(Math.max(0, totalReq.getFoodQuantity() - totalAllocatedFood))
                .medicalKitQuantity(Math.max(0, totalReq.getMedicalKitQuantity() - totalAllocatedMedical))
                .build())
            .metrics(Map.of("generations", 100, "populationSize", 50))
            .build();
    }

    private AllocationResult buildResultFromSolutionWithConstraints(double[] solution, 
                                                                     AllocationRequest request, 
                                                                     List<Warehouse> warehouses, 
                                                                     SupplyRequirement totalReq,
                                                                     int availableTent, int availableWater,
                                                                     int availableFood, int availableMedical) {
        List<PointAllocation> allocations = new ArrayList<>();
        double totalCost = 0;

        List<SupplyRequirement> pointReqs = new ArrayList<>();
        for (ReliefPoint point : request.getReliefPoints()) {
            pointReqs.add(calculatePointRequirement(point));
        }

        int totalReqTent = totalReq.getTentQuantity();
        int totalReqWater = totalReq.getWaterQuantity();
        int totalReqFood = totalReq.getFoodQuantity();
        int totalReqMedical = totalReq.getMedicalKitQuantity();

        double tentRatio = totalReqTent > 0 ? Math.min(1.0, (double) availableTent / totalReqTent) : 1.0;
        double waterRatio = totalReqWater > 0 ? Math.min(1.0, (double) availableWater / totalReqWater) : 1.0;
        double foodRatio = totalReqFood > 0 ? Math.min(1.0, (double) availableFood / totalReqFood) : 1.0;
        double medicalRatio = totalReqMedical > 0 ? Math.min(1.0, (double) availableMedical / totalReqMedical) : 1.0;

        int remainingTent = availableTent;
        int remainingWater = availableWater;
        int remainingFood = availableFood;
        int remainingMedical = availableMedical;
        int totalAllocatedTent = 0, totalAllocatedWater = 0;
        int totalAllocatedFood = 0, totalAllocatedMedical = 0;

        for (int i = 0; i < request.getReliefPoints().size(); i++) {
            ReliefPoint point = request.getReliefPoints().get(i);
            SupplyRequirement req = pointReqs.get(i);
            boolean isLast = (i == request.getReliefPoints().size() - 1);

            Warehouse nearest = findNearestWarehouse(point, warehouses);
            double distance = calculateDistance(point, nearest);

            int tent, water, food, medical;

            if (tentRatio >= 1.0 && waterRatio >= 1.0 && foodRatio >= 1.0 && medicalRatio >= 1.0) {
                tent = req.getTentQuantity();
                water = req.getWaterQuantity();
                food = req.getFoodQuantity();
                medical = req.getMedicalKitQuantity();
            } else if (isLast) {
                tent = Math.min(req.getTentQuantity(), remainingTent);
                water = Math.min(req.getWaterQuantity(), remainingWater);
                food = Math.min(req.getFoodQuantity(), remainingFood);
                medical = Math.min(req.getMedicalKitQuantity(), remainingMedical);
            } else {
                double solTentRatio = Math.min(1.0, solution[i * 4]);
                double solWaterRatio = Math.min(1.0, solution[i * 4 + 1]);
                double solFoodRatio = Math.min(1.0, solution[i * 4 + 2]);
                double solMedicalRatio = Math.min(1.0, solution[i * 4 + 3]);

                double fairTentRatio = (double) req.getTentQuantity() / totalReqTent;
                double fairWaterRatio = (double) req.getWaterQuantity() / totalReqWater;
                double fairFoodRatio = (double) req.getFoodQuantity() / totalReqFood;
                double fairMedicalRatio = (double) req.getMedicalKitQuantity() / totalReqMedical;

                int fairTent = (int) Math.ceil(availableTent * fairTentRatio);
                int fairWater = (int) Math.ceil(availableWater * fairWaterRatio);
                int fairFood = (int) Math.ceil(availableFood * fairFoodRatio);
                int fairMedical = (int) Math.ceil(availableMedical * fairMedicalRatio);

                int solTent = (int) Math.ceil(req.getTentQuantity() * solTentRatio);
                int solWater = (int) Math.ceil(req.getWaterQuantity() * solWaterRatio);
                int solFood = (int) Math.ceil(req.getFoodQuantity() * solFoodRatio);
                int solMedical = (int) Math.ceil(req.getMedicalKitQuantity() * solMedicalRatio);

                tent = Math.min(req.getTentQuantity(), Math.min(Math.min(fairTent, solTent), remainingTent));
                water = Math.min(req.getWaterQuantity(), Math.min(Math.min(fairWater, solWater), remainingWater));
                food = Math.min(req.getFoodQuantity(), Math.min(Math.min(fairFood, solFood), remainingFood));
                medical = Math.min(req.getMedicalKitQuantity(), Math.min(Math.min(fairMedical, solMedical), remainingMedical));
            }

            remainingTent -= tent;
            remainingWater -= water;
            remainingFood -= food;
            remainingMedical -= medical;
            totalAllocatedTent += tent;
            totalAllocatedWater += water;
            totalAllocatedFood += food;
            totalAllocatedMedical += medical;

            totalCost += distance * (tent + water + food + medical);

            double satisfaction = calculateSatisfaction(tent, water, food, medical,
                req.getTentQuantity(), req.getWaterQuantity(), req.getFoodQuantity(), req.getMedicalKitQuantity());

            allocations.add(PointAllocation.builder()
                .pointId(point.getId())
                .pointName(point.getName())
                .distance(distance)
                .allocated(SupplyRequirement.builder()
                    .tentQuantity(tent).waterQuantity(water)
                    .foodQuantity(food).medicalKitQuantity(medical).build())
                .requested(req)
                .satisfactionRate(satisfaction)
                .build());
        }

        double totalSatisfaction = calculateSatisfaction(
            totalAllocatedTent, totalAllocatedWater, totalAllocatedFood, totalAllocatedMedical,
            totalReqTent, totalReqWater, totalReqFood, totalReqMedical
        );

        return AllocationResult.builder()
            .algorithm("GENETIC")
            .totalCost(totalCost)
            .satisfactionRate(totalSatisfaction)
            .allocations(allocations)
            .unmetRequirements(SupplyRequirement.builder()
                .tentQuantity(Math.max(0, totalReqTent - totalAllocatedTent))
                .waterQuantity(Math.max(0, totalReqWater - totalAllocatedWater))
                .foodQuantity(Math.max(0, totalReqFood - totalAllocatedFood))
                .medicalKitQuantity(Math.max(0, totalReqMedical - totalAllocatedMedical))
                .build())
            .metrics(Map.of(
                "generations", 100, 
                "populationSize", 50,
                "fairAllocation", true
            ))
            .build();
    }

    private SupplyRequirement calculatePointRequirement(ReliefPoint point) {
        int pop = point.getAffectedPopulation();
        double priority = point.getPriority();
        return SupplyRequirement.builder()
            .tentQuantity((int) Math.ceil(pop * 0.4 * priority / 4))
            .waterQuantity((int) Math.ceil(pop * 1.5 * priority * 3))
            .foodQuantity((int) Math.ceil(pop * 1.2 * priority * 3))
            .medicalKitQuantity((int) Math.ceil(pop * 0.8 * priority / 10))
            .build();
    }

    private SupplyRequirement calculateTotalRequirement(List<ReliefPoint> points) {
        int tent = 0, water = 0, food = 0, medical = 0;
        for (ReliefPoint p : points) {
            SupplyRequirement req = calculatePointRequirement(p);
            tent += req.getTentQuantity();
            water += req.getWaterQuantity();
            food += req.getFoodQuantity();
            medical += req.getMedicalKitQuantity();
        }
        return SupplyRequirement.builder()
            .tentQuantity(tent).waterQuantity(water)
            .foodQuantity(food).medicalKitQuantity(medical).build();
    }

    private Warehouse findNearestWarehouse(ReliefPoint point, List<Warehouse> warehouses) {
        Warehouse nearest = null;
        double minDist = Double.MAX_VALUE;
        for (Warehouse w : warehouses) {
            double dist = calculateDistance(point.getLatitude(), point.getLongitude(),
                w.getLatitude(), w.getLongitude());
            if (dist < minDist) {
                minDist = dist;
                nearest = w;
            }
        }
        return nearest;
    }

    private double calculateDistance(ReliefPoint point, Warehouse warehouse) {
        return calculateDistance(point.getLatitude(), point.getLongitude(),
            warehouse.getLatitude(), warehouse.getLongitude());
    }

    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371;
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
            + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
            * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private double calculateSatisfaction(int at, int aw, int af, int am, int rt, int rw, int rf, int rm) {
        if (rt == 0 && rw == 0 && rf == 0 && rm == 0) return 1.0;
        double ts = rt > 0 ? (double) at / rt : 1;
        double ws = rw > 0 ? (double) aw / rw : 1;
        double fs = rf > 0 ? (double) af / rf : 1;
        double ms = rm > 0 ? (double) am / rm : 1;
        return Math.min(1, (ts + ws + fs + ms) / 4);
    }

    private List<Warehouse> getDefaultWarehouses() {
        List<Warehouse> list = new ArrayList<>();
        
        Warehouse w1 = new Warehouse();
        w1.setId(1L);
        w1.setName("中央仓库A");
        w1.setLatitude(39.9042);
        w1.setLongitude(116.4074);
        w1.setTentStock(5000);
        w1.setWaterStock(50000);
        w1.setFoodStock(30000);
        w1.setMedicalKitStock(2000);
        list.add(w1);

        Warehouse w2 = new Warehouse();
        w2.setId(2L);
        w2.setName("区域仓库B");
        w2.setLatitude(31.2304);
        w2.setLongitude(121.4737);
        w2.setTentStock(3000);
        w2.setWaterStock(30000);
        w2.setFoodStock(20000);
        w2.setMedicalKitStock(1500);
        list.add(w2);

        Warehouse w3 = new Warehouse();
        w3.setId(3L);
        w3.setName("区域仓库C");
        w3.setLatitude(30.5728);
        w3.setLongitude(104.0668);
        w3.setTentStock(2500);
        w3.setWaterStock(25000);
        w3.setFoodStock(15000);
        w3.setMedicalKitStock(1000);
        list.add(w3);

        return list;
    }

    public List<Warehouse> getWarehouses() {
        List<Warehouse> list = warehouseRepository.findAll();
        if (list.isEmpty()) {
            return getDefaultWarehouses();
        }
        return list;
    }
}
