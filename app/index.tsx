import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { LineChart } from 'react-native-chart-kit';

const SCREEN_WIDTH = Dimensions.get('window').width;

// 2026년 2월 8일 기준 fallback 가격
const FALLBACK_STOCK_PRICE = 411.78;

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

export default function HomeScreen() {
  const [stockCount, setStockCount] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<keyof typeof TESLA_VEHICLES>('Model 3');
  const [selectedTrimPrice, setSelectedTrimPrice] = useState(TESLA_VEHICLES['Model 3'][0].value);
  const [stockPrice, setStockPrice] = useState(FALLBACK_STOCK_PRICE);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('2026-02-08');
  const [result, setResult] = useState<{
    numberOfCars: number;
    totalValue: number;
    selectedModel: string;
  } | null>(null);
  const [error, setError] = useState('');
  const [historyData, setHistoryData] = useState<{
    labels: string[];
    values: number[];
  } | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // 실시간 주가 가져오기 함수
  const fetchStockPrice = async () => {
    setIsLoadingPrice(true);
    try {
      // Yahoo Finance API를 통한 실시간 가격 조회
      const response = await fetch(
        'https://query1.finance.yahoo.com/v8/finance/chart/TSLA?interval=1d&range=1d'
      );
      const data = await response.json();

      if (data?.chart?.result?.[0]?.meta?.regularMarketPrice) {
        const currentPrice = data.chart.result[0].meta.regularMarketPrice;
        setStockPrice(currentPrice);
        const now = new Date();
        setLastUpdated(now.toISOString().split('T')[0]);
      } else {
        throw new Error('가격 정보를 가져올 수 없습니다');
      }
    } catch (err) {
      Alert.alert(
        '주가 업데이트 실패',
        '실시간 주가를 가져오지 못했습니다. 기본 가격을 사용합니다.',
        [{ text: '확인' }]
      );
      console.error('Stock price fetch error:', err);
    } finally {
      setIsLoadingPrice(false);
    }
  };

  // 컴포넌트 마운트 시 주가 자동 조회
  useEffect(() => {
    fetchStockPrice();
  }, []);

  // 차량 변경 시 첫 번째 트림으로 자동 선택
  useEffect(() => {
    setSelectedTrimPrice(TESLA_VEHICLES[selectedVehicle][0].value);
  }, [selectedVehicle]);

  const fetchPriceHistory = async (stockCountNumber: number, vehiclePrice: number) => {
    setIsLoadingHistory(true);
    setHistoryData(null);
    try {
      const response = await fetch(
        'https://query1.finance.yahoo.com/v8/finance/chart/TSLA?interval=1mo&range=1y'
      );
      const data = await response.json();

      const result = data?.chart?.result?.[0];
      if (!result) throw new Error('데이터 없음');

      const timestamps: number[] = result.timestamps ?? result.timestamp ?? [];
      const closes: number[] = result.indicators?.quote?.[0]?.close ?? [];

      const paired = timestamps
        .map((ts: number, i: number) => ({ ts, close: closes[i] }))
        .filter((d: { ts: number; close: number }) => d.close != null);

      const labels = paired.map(({ ts }: { ts: number }) => {
        const d = new Date(ts * 1000);
        return `${d.getMonth() + 1}월`;
      });
      const values = paired.map(({ close }: { close: number }) =>
        (stockCountNumber * close) / vehiclePrice
      );

      setHistoryData({ labels, values });
    } catch {
      // 히스토리 조회 실패 시 조용히 무시 (메인 계산 결과는 표시)
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const calculateCars = () => {
    setError('');
    const stockCountNumber = Number.parseFloat(stockCount);

    if (!stockCount.trim()) {
      setError('주식 수를 입력해주세요');
      return;
    }

    if (Number.isNaN(stockCountNumber) || stockCountNumber <= 0) {
      setError('유효한 주식 수를 입력해주세요 (양수)');
      return;
    }

    const totalValue = stockCountNumber * stockPrice;
    const numberOfCars = totalValue / selectedTrimPrice;
    const selectedTrim = TESLA_VEHICLES[selectedVehicle].find(
      (v) => v.value === selectedTrimPrice
    )?.label || '';
    const selectedModel = `${selectedVehicle} ${selectedTrim}`;

    setResult({
      numberOfCars,
      totalValue,
      selectedModel,
    });

    fetchPriceHistory(stockCountNumber, selectedTrimPrice);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
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
              onPress={fetchStockPrice}
              disabled={isLoadingPrice}
            >
              {isLoadingPrice ? (
                <ActivityIndicator size="small" color="#E82127" />
              ) : (
                <Text style={styles.refreshButtonText}>🔄</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>보유한 Tesla 주식 수</Text>
          <TextInput
            style={[styles.input, error ? styles.inputError : null]}
            keyboardType="numeric"
            placeholder="예: 100"
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

            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>📈 1년간 구매 가능 대수 추이</Text>
              <Text style={styles.chartSubtitle}>{result.selectedModel} 기준</Text>
              {isLoadingHistory && (
                <View style={styles.chartLoading}>
                  <ActivityIndicator size="small" color="#E82127" />
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
                    width={SCREEN_WIDTH - 64}
                    height={220}
                    yAxisSuffix="대"
                    yAxisInterval={1}
                    chartConfig={{
                      backgroundColor: '#fff',
                      backgroundGradientFrom: '#fff',
                      backgroundGradientTo: '#fff',
                      decimalPlaces: 1,
                      color: (opacity = 1) => `rgba(232, 33, 39, ${opacity})`,
                      labelColor: () => '#666',
                      propsForDots: {
                        r: '4',
                        strokeWidth: '2',
                        stroke: '#E82127',
                      },
                      propsForBackgroundLines: {
                        stroke: '#f0f0f0',
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    color: '#E82127',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  priceInfoContainer: {
    backgroundColor: '#fff',
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
    color: '#333',
    marginBottom: 4,
  },
  priceInfoSubtext: {
    fontSize: 12,
    color: '#999',
  },
  refreshButton: {
    backgroundColor: '#f0f0f0',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  refreshButtonText: {
    fontSize: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#E82127',
  },
  errorText: {
    color: '#E82127',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  calculateButton: {
    backgroundColor: '#E82127',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#E82127',
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
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  resultCard: {
    backgroundColor: '#fff',
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
    backgroundColor: '#E82127',
  },
  resultLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  resultValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
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
    backgroundColor: '#fff',
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
    color: '#333',
    marginBottom: 4,
  },
  chartSubtitle: {
    fontSize: 12,
    color: '#999',
    marginBottom: 16,
  },
  chart: {
    borderRadius: 8,
    marginLeft: -16,
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
    color: '#999',
  },
  chartErrorText: {
    fontSize: 14,
    color: '#999',
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
    backgroundColor: '#E82127',
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
});
