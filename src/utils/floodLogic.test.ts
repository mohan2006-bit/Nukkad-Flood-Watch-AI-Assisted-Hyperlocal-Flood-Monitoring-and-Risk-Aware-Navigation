import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateTrustScore,
  evaluatePassability,
  getDepthCategory,
  calculateNeighborhoodRisk,
  parseWhatsAppFloodMessage,
  generateSafeRouteComparison
} from './floodLogic';
import { FloodReport } from '../types';

test('calculateTrustScore: higher base credibility for wardens and volunteers vs anonymous', () => {
  const wardenTrust = calculateTrustScore({
    reporterRole: 'warden',
    confirmationsCount: 0,
    hasPhoto: false,
    timestamp: Date.now()
  });

  const anonTrust = calculateTrustScore({
    reporterRole: 'anonymous',
    confirmationsCount: 0,
    hasPhoto: false,
    timestamp: Date.now()
  });

  assert.ok(wardenTrust.score > anonTrust.score);
  assert.equal(wardenTrust.breakdown.reporterScore, 90);
  assert.equal(anonTrust.breakdown.reporterScore, 35);
});

test('calculateTrustScore: adds photo bonus and community confirmation points', () => {
  const verifiedReport = calculateTrustScore({
    reporterRole: 'resident',
    confirmationsCount: 4, // 4 * 5 = 20 points
    hasPhoto: true, // +15 points
    timestamp: Date.now()
  });

  // 55 (resident) + 20 (confirmations) + 15 (photo) = 90
  assert.equal(verifiedReport.score, 90);
  assert.equal(verifiedReport.breakdown.photoBonus, 15);
  assert.equal(verifiedReport.breakdown.communityConfirmations, 20);
});

test('calculateTrustScore: applies time decay to older reports', () => {
  const currentTime = 1700000000000;
  const sixHoursAgo = currentTime - (6 * 60 * 60 * 1000);

  const fresh = calculateTrustScore({
    reporterRole: 'resident',
    confirmationsCount: 0,
    hasPhoto: false,
    timestamp: currentTime,
    currentTime
  });

  const stale = calculateTrustScore({
    reporterRole: 'resident',
    confirmationsCount: 0,
    hasPhoto: false,
    timestamp: sixHoursAgo,
    currentTime
  });

  assert.ok(stale.score < fresh.score);
  assert.ok(stale.breakdown.timeDecay < 0);
});

test('evaluatePassability: evaluates vehicle safety based on water depth and torrent currents', () => {
  // Shallow stagnant water is passable to all
  assert.equal(evaluatePassability(2, 'stagnant'), 'all');

  // 6 inches knee-deep water is caution for two wheelers
  assert.equal(evaluatePassability(6, 'stagnant'), 'two_wheeler');

  // 10 inches water is four-wheelers only
  assert.equal(evaluatePassability(10, 'stagnant'), 'four_wheeler_only');

  // 16 inches water is SUV only
  assert.equal(evaluatePassability(16, 'stagnant'), 'suv_only');

  // 24 inches water requires rescue boats
  assert.equal(evaluatePassability(24, 'stagnant'), 'boat_only');

  // Fast dangerous current blocks roads earlier
  assert.equal(evaluatePassability(10, 'fast_dangerous'), 'blocked');
});

test('getDepthCategory: maps inches to resident vernacular', () => {
  assert.equal(getDepthCategory(4), 'ankle');
  assert.equal(getDepthCategory(14), 'knee');
  assert.equal(getDepthCategory(30), 'waist');
  assert.equal(getDepthCategory(45), 'chest_above');
});

test('calculateNeighborhoodRisk: aggregates reports into appropriate risk level', () => {
  const mockReports: FloodReport[] = [
    {
      id: 'rep-1',
      neighborhoodId: 'velachery',
      neighborhoodName: 'Velachery',
      streetName: 'Lake View Road',
      waterDepthInches: 32,
      depthCategory: 'waist',
      flowSpeed: 'fast_dangerous',
      passability: 'boat_only',
      powerOutage: true,
      strandedVulnerableCount: 4,
      reporterName: 'Karthik',
      reporterRole: 'resident',
      trustScore: 85,
      trustBreakdown: { reporterScore: 55, communityConfirmations: 15, photoBonus: 15, timeDecay: 0, proximityBonus: 0 },
      confirmationsCount: 3,
      status: 'verified',
      notes: 'Water rushing from lake bund',
      timestamp: Date.now(),
      source: 'web'
    }
  ];

  const criticalResult = calculateNeighborhoodRisk(mockReports, 180);
  assert.equal(criticalResult.riskLevel, 'CRITICAL');
  assert.equal(criticalResult.maxDepthInches, 32);

  const safeResult = calculateNeighborhoodRisk([], 20);
  assert.equal(safeResult.riskLevel, 'SAFE');
});

test('parseWhatsAppFloodMessage: extracts location, depth and conditions from simulated citizen texts', () => {
  const englishMessage = "Water is knee deep near Vijayanagar bus stand in Velachery, power cut since 1 hour";
  const parsedEn = parseWhatsAppFloodMessage(englishMessage);

  assert.equal(parsedEn.neighborhoodId, 'velachery');
  assert.ok(parsedEn.streetName?.toLowerCase().includes('vijayanagar'));
  assert.equal(parsedEn.depthCategory, 'knee');
  assert.equal(parsedEn.powerOutage, true);

  const tamilMessage = "மடிப்பாக்கம் குபேரன் நகர் இடுப்பளவு தண்ணீர் வேகமாக பாய்கிறது";
  const parsedTa = parseWhatsAppFloodMessage(tamilMessage);

  assert.equal(parsedTa.neighborhoodId, 'madipakkam');
  assert.equal(parsedTa.depthCategory, 'waist');
  assert.equal(parsedTa.flowSpeed, 'fast_dangerous');
});

test('generateSafeRouteComparison: returns route comparison with flyover elevated corridor', () => {
  const routes = generateSafeRouteComparison('Madipakkam', 'Chennai Airport / Guindy');
  assert.ok(routes.safeRoute.recommendationScore > routes.directRoute.recommendationScore);
  assert.equal(routes.safeRoute.type, 'safe_corridor');
  assert.equal(routes.directRoute.type, 'direct_hazardous');
  assert.ok(routes.safeRoute.elevatedFlyovers.length > 0);
  assert.ok(routes.safeRoute.distanceKm > 0);
  assert.ok(routes.directRoute.distanceKm > 0);

  // Different destinations must produce genuinely different distances and travel times
  const shortTrip = generateSafeRouteComparison('Madipakkam', 'Velachery');
  const longTrip = generateSafeRouteComparison('Madipakkam', 'Chennai Central Station');
  assert.notEqual(shortTrip.safeRoute.distanceKm, longTrip.safeRoute.distanceKm);
  assert.ok(longTrip.safeRoute.distanceKm > shortTrip.safeRoute.distanceKm);
  assert.ok(longTrip.safeRoute.timeMins > shortTrip.safeRoute.timeMins);

  // Different travel modes adjust speed and flood penalties
  const carCloudburst = generateSafeRouteComparison(
    'Madipakkam',
    'Chennai Airport / Guindy',
    {
      id: 'monsoon_burst',
      name: 'Monsoonal Cloudburst (Peak Discharge)',
      nameTa: 'மழை',
      reservoirDischargeCusecs: 12500,
      poondiDischargeCusecs: 8200,
      rainfall1hMm: 42,
      redAlertLevel: 'Red',
      description: 'Cloudburst'
    },
    [],
    'car'
  );
  const emergencyCloudburst = generateSafeRouteComparison(
    'Madipakkam',
    'Chennai Airport / Guindy',
    {
      id: 'monsoon_burst',
      name: 'Monsoonal Cloudburst (Peak Discharge)',
      nameTa: 'மழை',
      reservoirDischargeCusecs: 12500,
      poondiDischargeCusecs: 8200,
      rainfall1hMm: 42,
      redAlertLevel: 'Red',
      description: 'Cloudburst'
    },
    [],
    'emergency'
  );
  assert.ok(carCloudburst.directRoute.timeMins > emergencyCloudburst.directRoute.timeMins);

  // Receding waters reduces depth, flood delay, and total duration vs cloudburst
  const receding = generateSafeRouteComparison(
    'Madipakkam',
    'Chennai Airport / Guindy',
    {
      id: 'receding_pumping',
      name: 'Receding Waters (Pumps Active)',
      nameTa: 'வடியும்',
      reservoirDischargeCusecs: 1200,
      poondiDischargeCusecs: 800,
      rainfall1hMm: 2,
      redAlertLevel: 'Yellow',
      description: 'Receding'
    },
    [],
    'car'
  );
  assert.ok(carCloudburst.directRoute.timeMins > receding.directRoute.timeMins);
  assert.ok(carCloudburst.directRoute.maxWaterDepthInches > receding.directRoute.maxWaterDepthInches);

  // Deterministic output (no randomness)
  const repeat = generateSafeRouteComparison(
    'Madipakkam',
    'Chennai Airport / Guindy',
    {
      id: 'monsoon_burst',
      name: 'Monsoonal Cloudburst (Peak Discharge)',
      nameTa: 'மழை',
      reservoirDischargeCusecs: 12500,
      poondiDischargeCusecs: 8200,
      rainfall1hMm: 42,
      redAlertLevel: 'Red',
      description: 'Cloudburst'
    },
    [],
    'car'
  );
  assert.deepEqual(carCloudburst, repeat);
});


