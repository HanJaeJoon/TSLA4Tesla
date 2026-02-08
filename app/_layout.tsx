import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

// 2026년 2월 8일 기준 최신 가격
const TESLA_STOCK_PRICE = 411.78;

const MODEL_3_VARIANTS = [
  { label: 'Model 3 Standard (RWD)', value: 38630 },
  { label: 'Model 3 Premium (RWD)', value: 44130 },
  { label: 'Model 3 Premium (AWD)', value: 49130 },
  { label: 'Model 3 Performance (AWD)', value: 56630 },
];

export default function RootLayout() {
  const [stockCount, setStockCount] = useState('');
  const [selectedModelPrice, setSelectedModelPrice] = useState(MODEL_3_VARIANTS[0].value);
  const [result, setResult] = useState<{
    numberOfCars: number;
    totalValue: number;
    selectedModel: string;
  } | null>(null);
  const [error, setError] = useState('');

  const calculateCars = () => {
    setError('');
    const stockCountNumber = parseFloat(stockCount);

    if (!stockCount.trim()) {
      setError('주식 수를 입력해주세요');
      return;
    }

    if (Number.isNaN(stockCountNumber) || stockCountNumber <= 0) {
      setError('유효한 주식 수를 입력해주세요 (양수)');
      return;
    }

    const totalValue = stockCountNumber * TESLA_STOCK_PRICE;
    const numberOfCars = totalValue / selectedModelPrice;
    const selectedModel = MODEL_3_VARIANTS.find(v => v.value === selectedModelPrice)?.label || '';

    setResult({
      numberOfCars,
      totalValue,
      selectedModel,
    });
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
          <Text style={styles.subtitle}>Tesla 주식으로 Model 3 구매 계산기</Text>
        </View>

        <View style={styles.priceInfoContainer}>
          <Text style={styles.priceInfoText}>
            현재 TSLA 주가: {formatCurrency(TESLA_STOCK_PRICE)}
          </Text>
          <Text style={styles.priceInfoSubtext}>
            2026년 2월 8일 기준
          </Text>
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
          <Text style={styles.label}>Model 3 옵션 선택</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedModelPrice}
              onValueChange={(itemValue: number) => setSelectedModelPrice(itemValue)}
              style={styles.picker}
            >
              {MODEL_3_VARIANTS.map((variant) => (
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
              <Text style={styles.resultLabel}>구매 가능 대수</Text>
              <Text style={styles.mainResultValue}>
                {result.numberOfCars.toFixed(2)} 대
              </Text>
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
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  mainResultValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
});