import { StyleSheet } from 'react-native';
import { FAB } from 'react-native-paper';

export function FloatingMenu({ navigation }) {
    return (
        <FAB
            style={styles.fab}
            small="false"
            //label="등록"
            icon="plus"
            onPress={() => navigation.navigate('등록하기')}
        />
    );
}

const styles = StyleSheet.create({
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
    },
});