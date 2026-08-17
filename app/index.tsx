import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
  RefreshControl,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import {
  parseStockCount,
  calculatePurchase,
  buildHistorySeries,
  formatCurrency,
  shortfallToNextCar,
  formatKrwApprox,
  getPeriodConfig,
  decimateLabels,
  ChartPeriod,
} from '../lib/calculator';
import { saveInputs, loadInputs } from '../lib/preferences';
import { getSnapshotSeries, MarketSnapshot } from '../lib/snapshot';
import marketSnapshotJson from '../assets/data/market-snapshot.json';

// 릴리스 시점에 scripts/update-market-snapshot.js로 갱신되는 오프라인 fallback 데이터
const SNAPSHOT = marketSnapshotJson as MarketSnapshot;

const SCREEN_WIDTH = Dimensions.get('window').width;

const CHART_PERIODS: ChartPeriod[] = ['1M', '6M', '1Y', '5Y'];
const MAX_CHART_LABELS = 6;
const FETCH_TIMEOUT_MS = 10000;

const BRAND_RED = '#E82127';

const PALETTES = {
  light: {
    background: '#f5f5f5',
    card: '#ffffff',
    text: '#333333',
    subtext: '#666666',
    faint: '#999999',
    border: '#dddddd',
    buttonBg: '#f0f0f0',
    chartGrid: '#f0f0f0',
    bannerBg: '#fdecea',
  },
  dark: {
    background: '#121212',
    card: '#1e1e1e',
    text: '#f2f2f2',
    subtext: '#b3b3b3',
    faint: '#8a8a8a',
    border: '#3a3a3a',
    buttonBg: '#2a2a2a',
    chartGrid: '#2e2e2e',
    bannerBg: '#3a2020',
  },
};

// Tesla 차량 모델 및 트림 정보
const TESLA_VEHICLES = {
  'Model 3': [
    { label: 'Standard (RWD)', value: 38630 },
    { label: 'Premium (RWD)', value: 44130 },
    { label: 'Premium (AWD)', value: 49130 },
    { label: 'Performance (AWD)', value: 56630 },
  ],
  'Model Y': [
    { label: 'Standard (RWD)', value: 41630 },
    { label: 'Premium (RWD)', value: 46630 },
    { label: 'Premium (AWD)', value: 50630 },
    { label: 'Performance (AWD)', value: 59130 },
  ],
  'Model S': [
    { label: 'AWD', value: 91630 },
    { label: 'Plaid', value: 106630 },
  ],
  'Model X': [
    { label: 'AWD', value: 91630 },
    { label: 'Plaid', value: 106630 },
  ],
  'Cybertruck': [
    { label: 'AWD', value: 79990 },
    { label: 'Cyberbeast', value: 99990 },
  ],
};

const formatDateTime = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// Yahoo Finance는 브라우저 User-Agent가 없는 요청(okhttp 등)을 429로 차단한다
const YAHOO_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
};

// 타임아웃이 헤더 수신뿐 아니라 본문 파싱까지 커버하도록 json 읽기까지 포함한다
const fetchJsonWithTimeout = async (url: string) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: YAHOO_HEADERS,
    });
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
};

// 'loading' 이후 실시간 조회 성공 여부에 따라 live / stale(과거 성공값 표시) / snapshot(번들 데이터)
type PriceStatus = 'loading' | 'live' | 'stale' | 'snapshot';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = PALETTES[colorScheme === 'dark' ? 'dark' : 'light'];
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [stockCount, setStockCount] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<keyof typeof TESLA_VEHICLES>('Model 3');
  const [selectedTrimPrice, setSelectedTrimPrice] = useState(TESLA_VEHICLES['Model 3'][0].value);
  const [stockPrice, setStockPrice] = useState(SNAPSHOT.price);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [priceStatus, setPriceStatus] = useState<PriceStatus>('loading');
  const [lastUpdated, setLastUpdated] = useState<string>(SNAPSHOT.updatedAt);
  const [usdKrw, setUsdKrw] = useState<number | null>(SNAPSHOT.usdKrw);
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('1Y');
  const [hydrated, setHydrated] = useState(false);
  const [result, setResult] = useState<{
    numberOfCars: number;
    totalValue: number;
    selectedModel: string;
    stockCountNum: number;
    vehiclePrice: number;
    shortfall: { targetCars: number; neededValue: number; neededShares: number };
  } | null>(null);
  const [error, setError] = useState('');
  const [historyData, setHistoryData] = useState<{
    labels: string[];
    values: number[];
  } | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const priceFetchInFlight = useRef(false);

  // 실시간 주가 가져오기. 수동 새로고침일 때만 실패 Alert 표시
  const fetchStockPrice = useCallback(async (alertOnError: boolean) => {
    if (priceFetchInFlight.current) return;
    priceFetchInFlight.current = true;
    setIsLoadingPrice(true);
    try {
      const data = await fetchJsonWithTimeout(
        'https://query1.finance.yahoo.com/v8/finance/chart/TSLA?interval=1d&range=1d'
      );

      const currentPrice = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
      if (!currentPrice) {
        throw new Error('가격 정보를 가져올 수 없습니다');
      }
      setStockPrice(currentPrice);
      setPriceStatus('live');
      setLastUpdated(formatDateTime(new Date()));
    } catch (err) {
      // 이전에 실시간 값을 받은 적이 있으면 그 값을 유지하며 stale로,
      // 아니면 번들 스냅샷 데이터를 사용 중임을 표시
      setPriceStatus((prev) => (prev === 'live' || prev === 'stale' ? 'stale' : 'snapshot'));
      if (alertOnError) {
        Alert.alert(
          '주가 업데이트 실패',
          '실시간 주가를 가져오지 못했습니다. 저장된 가격을 사용합니다.',
          [{ text: '확인' }]
        );
      }
      console.error('Stock price fetch error:', err);
    } finally {
      priceFetchInFlight.current = false;
      setIsLoadingPrice(false);
    }
  }, []);

  // USD/KRW 환율 조회 (실패 시 스냅샷 환율 유지)
  const fetchExchangeRate = useCallback(async () => {
    try {
      const data = await fetchJsonWithTimeout(
        'https://query1.finance.yahoo.com/v8/finance/chart/KRW=X?interval=1d&range=1d'
      );
      const rate = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
      if (rate) setUsdKrw(rate);
    } catch {
      // 환율 없이도 앱은 동작
    }
  }, []);

  // 컴포넌트 마운트 시 주가/환율 자동 조회 (실패해도 Alert 없이 배너로 안내)
  useEffect(() => {
    fetchStockPrice(false);
    fetchExchangeRate();
  }, [fetchStockPrice, fetchExchangeRate]);

  // 저장된 입력값 복원
  useEffect(() => {
    (async () => {
      const saved = await loadInputs();
      const vehicle = saved?.vehicle as keyof typeof TESLA_VEHICLES | undefined;
      if (saved && vehicle && TESLA_VEHICLES[vehicle]) {
        setStockCount(saved.stockCount);
        setSelectedVehicle(vehicle);
        const trims = TESLA_VEHICLES[vehicle];
        setSelectedTrimPrice(
          trims.some((t) => t.value === saved.trimPrice) ? saved.trimPrice : trims[0].value
        );
      }
      setHydrated(true);
    })();
  }, []);

  // 입력값 변경 시 저장 (복원 완료 전에는 기본값으로 덮어쓰지 않음)
  useEffect(() => {
    if (!hydrated) return;
    saveInputs({ stockCount, vehicle: selectedVehicle, trimPrice: selectedTrimPrice });
  }, [hydrated, stockCount, selectedVehicle, selectedTrimPrice]);

  // 차량 변경으로 현재 트림이 목록에 없으면 첫 번째 트림으로 이동
  useEffect(() => {
    const trims = TESLA_VEHICLES[selectedVehicle];
    if (!trims.some((t) => t.value === selectedTrimPrice)) {
      setSelectedTrimPrice(trims[0].value);
    }
  }, [selectedVehicle, selectedTrimPrice]);

  const onPullToRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([fetchStockPrice(false), fetchExchangeRate()]);
    setIsRefreshing(false);
  }, [fetchStockPrice, fetchExchangeRate]);

  const historyRequestId = useRef(0);
  const historyCache = useRef(
    new Map<ChartPeriod, { timestamps: number[]; closes: (number | null)[] }>()
  );

  const fetchPriceHistory = async (
    stockCountNumber: number,
    vehiclePrice: number,
    period: ChartPeriod
  ) => {
    // 탭을 빠르게 전환할 때 늦게 도착한 이전 기간 응답이 화면을 덮지 않도록 최신 요청만 반영
    const requestId = ++historyRequestId.current;
    setIsLoadingHistory(true);
    setHistoryData(null);

    const applySeries = (series: { labels: string[]; values: number[] }) => {
      if (requestId !== historyRequestId.current) return;
      setHistoryData({
        labels: decimateLabels(series.labels, MAX_CHART_LABELS),
        values: series.values,
      });
    };

    try {
      const { range, interval, formatLabel } = getPeriodConfig(period);

      let raw = historyCache.current.get(period);
      if (!raw) {
        const data = await fetchJsonWithTimeout(
          `https://query1.finance.yahoo.com/v8/finance/chart/TSLA?interval=${interval}&range=${range}`
        );
        const chartResult = data?.chart?.result?.[0];
        if (!chartResult) throw new Error('데이터 없음');
        raw = {
          timestamps: chartResult.timestamps ?? chartResult.timestamp ?? [],
          closes: chartResult.indicators?.quote?.[0]?.close ?? [],
        };
        historyCache.current.set(period, raw);
      }

      applySeries(
        buildHistorySeries(raw.timestamps, raw.closes, stockCountNumber, vehiclePrice, formatLabel)
      );
    } catch {
      // 조회 실패 시 번들 스냅샷 데이터로 대체 (그래도 없으면 안내 문구 표시)
      const fallback = getSnapshotSeries(SNAPSHOT, period, stockCountNumber, vehiclePrice);
      if (fallback) applySeries(fallback);
    } finally {
      if (requestId === historyRequestId.current) {
        setIsLoadingHistory(false);
      }
    }
  };

  const changeChartPeriod = (period: ChartPeriod) => {
    setChartPeriod(period);
    if (result) {
      fetchPriceHistory(result.stockCountNum, result.vehiclePrice, period);
    }
  };

  const calculateCars = () => {
    setError('');
    const parsed = parseStockCount(stockCount);

    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }

    const { totalValue, numberOfCars } = calculatePurchase(
      parsed.value,
      stockPrice,
      selectedTrimPrice
    );
    const selectedTrim = TESLA_VEHICLES[selectedVehicle].find(
      (v) => v.value === selectedTrimPrice
    )?.label || '';

    setResult({
      numberOfCars,
      totalValue,
      selectedModel: `${selectedVehicle} ${selectedTrim}`,
      stockCountNum: parsed.value,
      vehiclePrice: selectedTrimPrice,
      shortfall: shortfallToNextCar(parsed.value, stockPrice, selectedTrimPrice),
    });

    fetchPriceHistory(parsed.value, selectedTrimPrice, chartPeriod);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onPullToRefresh}
            tintColor={BRAND_RED}
            colors={[BRAND_RED]}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>TSLA4Tesla</Text>
          <Text style={styles.subtitle}>Tesla 주식으로 차량 구매 계산기</Text>
        </View>

        <View style={styles.priceInfoContainer}>
          <View style={styles.priceInfoRow}>
            <View>
              <Text style={styles.priceInfoText}>
                현재 TSLA 주가: {formatCurrency(stockPrice)}
              </Text>
              <Text style={styles.priceInfoSubtext}>
                {lastUpdated} 기준
              </Text>
            </View>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={() => fetchStockPrice(true)}
              disabled={isLoadingPrice}
              accessibilityLabel="주가 새로고침"
            >
              {isLoadingPrice ? (
                <ActivityIndicator size="small" color={BRAND_RED} />
              ) : (
                <Ionicons name="refresh" size={22} color={BRAND_RED} />
              )}
            </TouchableOpacity>
          </View>
          {(priceStatus === 'snapshot' || priceStatus === 'stale') && (
            <View style={styles.fallbackBanner}>
              <Ionicons name="information-circle-outline" size={16} color={BRAND_RED} />
              <Text style={styles.fallbackBannerText}>
                {priceStatus === 'snapshot'
                  ? `실시간 조회 실패 - ${SNAPSHOT.updatedAt} 기준 저장 데이터 사용 중`
                  : `실시간 조회 실패 - 마지막 업데이트(${lastUpdated}) 가격 표시 중`}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>보유한 Tesla 주식 수</Text>
          <TextInput
            style={[styles.input, error ? styles.inputError : null]}
            keyboardType="numeric"
            placeholder="예: 100"
            placeholderTextColor={colors.faint}
            value={stockCount}
            onChangeText={(text) => {
              setStockCount(text);
              setError('');
            }}
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>차량 모델 선택</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedVehicle}
              onValueChange={(itemValue: keyof typeof TESLA_VEHICLES) =>
                setSelectedVehicle(itemValue)
              }
              style={styles.picker}
              dropdownIconColor={colors.subtext}
            >
              {Object.keys(TESLA_VEHICLES).map((vehicle) => (
                <Picker.Item key={vehicle} label={vehicle} value={vehicle} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>트림 선택</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedTrimPrice}
              onValueChange={(itemValue: number) => setSelectedTrimPrice(itemValue)}
              style={styles.picker}
              dropdownIconColor={colors.subtext}
            >
              {TESLA_VEHICLES[selectedVehicle].map((variant) => (
                <Picker.Item
                  key={variant.value}
                  label={`${variant.label} - ${formatCurrency(variant.value)}`}
                  value={variant.value}
                />
              ))}
            </Picker>
          </View>
        </View>

        <TouchableOpacity style={styles.calculateButton} onPress={calculateCars}>
          <Text style={styles.calculateButtonText}>계산하기</Text>
        </TouchableOpacity>

        {result && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>계산 결과</Text>
            <View style={styles.resultCard}>
              <Text style={styles.resultLabel}>주식 총 가치</Text>
              <Text style={styles.resultValue}>{formatCurrency(result.totalValue)}</Text>
              {usdKrw != null && (
                <Text style={styles.resultSubValue}>
                  {formatKrwApprox(result.totalValue, usdKrw)}
                </Text>
              )}
            </View>
            <View style={styles.resultCard}>
              <Text style={styles.resultLabel}>선택한 모델</Text>
              <Text style={styles.resultValue}>{result.selectedModel}</Text>
            </View>
            <View style={[styles.resultCard, styles.mainResultCard]}>
              <Text style={[styles.resultLabel, styles.mainResultLabel]}>구매 가능 대수</Text>
              <Text style={styles.mainResultValue}>
                {result.numberOfCars.toFixed(2)} 대
              </Text>
            </View>

            <View style={styles.resultCard}>
              <Text style={styles.resultLabel}>
                다음 목표: {result.shortfall.targetCars}대까지
              </Text>
              <Text style={styles.resultValue}>
                {result.shortfall.neededShares.toFixed(1)}주 부족 ({formatCurrency(result.shortfall.neededValue)})
              </Text>
              {usdKrw != null && (
                <Text style={styles.resultSubValue}>
                  {formatKrwApprox(result.shortfall.neededValue, usdKrw)}
                </Text>
              )}
            </View>

            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>구매 가능 대수 추이</Text>
              <Text style={styles.chartSubtitle}>{result.selectedModel} 기준</Text>
              <View style={styles.periodTabs}>
                {CHART_PERIODS.map((period) => (
                  <TouchableOpacity
                    key={period}
                    style={[
                      styles.periodTab,
                      chartPeriod === period && styles.periodTabActive,
                    ]}
                    onPress={() => changeChartPeriod(period)}
                  >
                    <Text
                      style={[
                        styles.periodTabText,
                        chartPeriod === period && styles.periodTabTextActive,
                      ]}
                    >
                      {period}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {isLoadingHistory && (
                <View style={styles.chartLoading}>
                  <ActivityIndicator size="small" color={BRAND_RED} />
                  <Text style={styles.chartLoadingText}>히스토리 불러오는 중...</Text>
                </View>
              )}
              {!isLoadingHistory && historyData && historyData.values.length > 1 && (
                <>
                  <LineChart
                    data={{
                      labels: historyData.labels,
                      datasets: [{ data: historyData.values }],
                    }}
                    width={SCREEN_WIDTH - 80}
                    height={220}
                    yAxisSuffix="대"
                    yAxisInterval={1}
                    chartConfig={{
                      backgroundColor: colors.card,
                      backgroundGradientFrom: colors.card,
                      backgroundGradientTo: colors.card,
                      decimalPlaces: 1,
                      color: (opacity = 1) => `rgba(232, 33, 39, ${opacity})`,
                      labelColor: () => colors.subtext,
                      propsForDots: {
                        r: '4',
                        strokeWidth: '2',
                        stroke: BRAND_RED,
                      },
                      propsForBackgroundLines: {
                        stroke: colors.chartGrid,
                      },
                    }}
                    bezier
                    style={styles.chart}
                  />
                  <View style={styles.chartLegend}>
                    <View style={styles.legendDot} />
                    <Text style={styles.legendText}>월별 구매 가능 대수 (주가 기준)</Text>
                  </View>
                </>
              )}
              {!isLoadingHistory && !historyData && (
                <Text style={styles.chartErrorText}>히스토리 데이터를 불러올 수 없습니다</Text>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: (typeof PALETTES)['light']) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: 20,
    },
    header: {
      alignItems: 'center',
      marginBottom: 30,
      marginTop: 20,
    },
    title: {
      fontSize: 32,
      fontWeight: 'bold',
      color: BRAND_RED,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.subtext,
      textAlign: 'center',
    },
    priceInfoContainer: {
      backgroundColor: colors.card,
      padding: 16,
      borderRadius: 12,
      marginBottom: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    priceInfoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%',
    },
    priceInfoText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    priceInfoSubtext: {
      fontSize: 12,
      color: colors.faint,
    },
    refreshButton: {
      backgroundColor: colors.buttonBg,
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    fallbackBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.bannerBg,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 8,
      marginTop: 12,
    },
    fallbackBannerText: {
      flex: 1,
      fontSize: 12,
      color: colors.subtext,
    },
    inputContainer: {
      marginBottom: 20,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 8,
      color: colors.text,
    },
    input: {
      backgroundColor: colors.card,
      height: 50,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 16,
      fontSize: 16,
      color: colors.text,
    },
    inputError: {
      borderColor: BRAND_RED,
    },
    errorText: {
      color: BRAND_RED,
      fontSize: 12,
      marginTop: 4,
      marginLeft: 4,
    },
    pickerContainer: {
      backgroundColor: colors.card,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    picker: {
      height: 56,
      color: colors.text,
    },
    calculateButton: {
      backgroundColor: BRAND_RED,
      paddingVertical: 16,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 10,
      shadowColor: BRAND_RED,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
    },
    calculateButtonText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: 'bold',
    },
    resultContainer: {
      marginTop: 30,
    },
    resultTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 16,
      textAlign: 'center',
    },
    resultCard: {
      backgroundColor: colors.card,
      padding: 20,
      borderRadius: 12,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    mainResultCard: {
      backgroundColor: BRAND_RED,
    },
    resultLabel: {
      fontSize: 14,
      color: colors.subtext,
      marginBottom: 4,
    },
    resultValue: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    resultSubValue: {
      fontSize: 13,
      color: colors.faint,
      marginTop: 4,
    },
    periodTabs: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 12,
    },
    periodTab: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: colors.buttonBg,
    },
    periodTabActive: {
      backgroundColor: BRAND_RED,
    },
    periodTabText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.subtext,
    },
    periodTabTextActive: {
      color: '#fff',
    },
    mainResultLabel: {
      fontSize: 14,
      color: '#fff',
      marginBottom: 4,
      opacity: 0.9,
    },
    mainResultValue: {
      fontSize: 28,
      fontWeight: 'bold',
      color: '#fff',
    },
    chartContainer: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 20,
      marginTop: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    chartTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    chartSubtitle: {
      fontSize: 12,
      color: colors.faint,
      marginBottom: 16,
    },
    chart: {
      borderRadius: 8,
    },
    chartLoading: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
      gap: 8,
    },
    chartLoadingText: {
      fontSize: 14,
      color: colors.faint,
    },
    chartErrorText: {
      fontSize: 14,
      color: colors.faint,
      textAlign: 'center',
      paddingVertical: 30,
    },
    chartLegend: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
      gap: 6,
    },
    legendDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: BRAND_RED,
    },
    legendText: {
      fontSize: 12,
      color: colors.subtext,
    },
  });
