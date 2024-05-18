import * as React from 'react';
import { SafeAreaView, View, StyleSheet } from 'react-native';
import { TextInput, HelperText, Button } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import moment from 'moment';

import Transaction from '../models/transaction';
import { insertTx } from '../helpers/database';

export default function AddTransaction() {
  const [count, setCount] = React.useState('0');
  const [price, setPrice] = React.useState('0');
  const [date, setDate] = React.useState(new Date());
  const [show, setShow] = React.useState(false);
  const [isBuying, setIsBuying] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(false);

  const onChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShow(Platform.OS === 'ios');
    setDate(currentDate);
  };

  const showDatepicker = () => {
    setShow(true);
  };

  const hasErrors = () => {
    let regex = /^[0-9\.]*$/;

    if (!regex.test(count)) return true;
    if (count == '0') return true;
    if (!regex.test(price)) return true;
    if (price == '0') return true;

    return false;
  };

  const addTransaction = () => {
    setIsLoading(true);

    insertTx(new Transaction(
        'TSLA',
        count,
        price,
        moment(date).format('YYYY-MM-DD'),
        isBuying
    ))
      .then(() => {
        setIsLoading(false);
        alert("등록 성공!")
      })
      .catch(() => alert("등록 실패!"));

    setCount('0');
    setPrice('0');
    setDate(new Date());
    setIsBuying(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <TextInput
        label="종목명"
        value="TSLA"
        disabled="true"
        selectionColor="#1fc685"
      />
      <Picker
        selectedValue={isBuying.toString()}
        onValueChange={(itemValue, itemIndex) =>
          setIsBuying(itemValue === "true")
        }>
        <Picker.Item label="매수" value="true" style={{ color: 'red'}} />
        <Picker.Item label="매도" value="false" style={{ color: 'blue'}} />
      </Picker>
      <TextInput
        label="수량"
        placeholder="수량을 입력해주세요."
        value={count}
        right={<TextInput.Affix text="주" />}
        onChangeText={count => setCount(count)}
        activeUnderlineColor="#1fc685"
      />
      <TextInput
        label="단가"
        placeholder="단가를 입력해주세요."
        value={price}
        right={<TextInput.Affix text="USD" />}
        onChangeText={price => setPrice(price)}
        activeUnderlineColor="#1fc685"
      />
      <TextInput
        label="날짜"
        value={moment(date).format('YYYY-MM-DD')}
        onFocus={showDatepicker}
        right={<TextInput.Icon
          name="calendar"
          onPress={showDatepicker}
          />}
        activeUnderlineColor="#1fc685"
      />
      {show && (
        <DateTimePicker
          testID="dateTimePicker"
          value={date}
          mode="date"
          display="default"
          onChange={onChange}
          backgroundColor="#1fc685"
        />
      )}
      <HelperText type="error" visible={hasErrors()}>
        수량, 단가를 확인해주세요.
      </HelperText>
      <View>
        <Button
          style={styles.button}
          mode="contained"
          onPress={addTransaction}
          loading={isLoading}
          disabled={hasErrors()}
        >
          등록
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  button: {
    backgroundColor: '#1fc685',
  },
}); 