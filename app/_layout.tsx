import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  Button,
  View,
} from 'react-native';

export default function RootLayout() {
  const [stockCount, setStockCount] = useState('');
  const [model3Price, setModel3Price] = useState(40_240); // 대략적인 Tesla Model 3 가격
  const [result, setResult] = useState<number>(0);

  const calculateCars = () => {
    const stockCountNumber = parseFloat(stockCount);
    if (!isNaN(stockCountNumber) && stockCountNumber > 0) {
      const teslaStockPrice = 177.48; // 대략적인 Tesla 주식 가격, 실제 데이터로 교체 필요
      const numberOfCars = (stockCountNumber * teslaStockPrice) / model3Price;
      setResult(numberOfCars);
    } else {
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>보유한 Tesla 주식 수를 입력하세요:</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={stockCount}
          onChangeText={setStockCount}
        />
        <Button title="계산" onPress={calculateCars} />
      </View>
      {result !== null && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultText}>
            {typeof result === 'number'
              ? `구매 가능한 Tesla Model 3의 대수: ${result.toFixed(2)}`
              : result}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  resultContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  resultText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});