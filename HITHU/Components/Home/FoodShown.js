import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Button, CheckBox } from "@rneui/themed";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { endpoints, authAPI } from "../../configs/APIs";
import Styles from "./Styles";
import { useNavigation } from "@react-navigation/native";

const FoodShown = ({ route }) => {
  const navigation = useNavigation();
  const { foodId } = route.params;
  const [food, setFood] = useState(null);
  const [toppings, setToppings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [toppingChecked, setToppingChecked] = useState({});
  useEffect(() => {
    fetchFoodAndToppings();
  }, [foodId]);

  const fetchFoodAndToppings = async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      const api = authAPI(token);
      const [foodResponse, toppingsResponse] = await Promise.all([
        api.get(endpoints["food-info"](foodId)),
        api.get(endpoints["food-topping"](foodId)),
      ]);

      setFood(foodResponse.data);
      setToppings(toppingsResponse.data);
    } catch (error) {
      console.error("Error fetching food and toppings:", error);
    } finally {
      setLoading(false);
    }
  };

  const incrementQuantity = () => setQuantity(quantity + 1);
  const decrementQuantity = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const handleOrder = () => {
    const selectedToppings = Object.entries(toppingChecked)
      .filter(([id, isChecked]) => isChecked)
      .map(([id]) => toppings.find((topping) => topping.id.toString() === id));
    console.log("Sllllll: ",quantity);
    const orderItem = {
      food: {
        id: food.id,
        name: food.name,
        price: food.price,
        image: food.image,
        store: food.store,
      },
      quantity: quantity,
      toppings: selectedToppings,
      totalPrice:
        (food.price + selectedToppings.reduce((sum, topping) => sum + topping.price, 0)) * quantity ,
    };
    
    console.log("Data sent: ", orderItem);
    console.log("food.store: ", food.store);

    navigation.navigate("Order", { newOrderItem: orderItem });
  };

  if (loading) {
    return (
      <View style={Styles.centered}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  // Render food details only when food state is not null
  if (!food) {
    return (
      <View style={Styles.centered}>
        <Text>Error: Food not found!</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={Styles.overlayContent}>
      <Image source={{ uri: food.image }} style={Styles.overlayImage} />
      <Text style={Styles.overlayFoodName}>{food.name}</Text>
      <Text style={Styles.title}>Mô tả</Text>
      <Text style={Styles.overlayDescription}>{food.description}</Text>
      <Text style={Styles.overlayPrice}>{formatPrice(food.price)}đ</Text>

      <Text style={Styles.title}>Toppings:</Text>
      {toppings.length > 0 ? (
        toppings.map((topping) => (
          <View key={topping.id} style={Styles.overlayToppingRow}>
            <Text>{topping.name}</Text>
            <View style={Styles.toppingPriceContainer}>
              <Text>{formatPrice(topping.price)}đ</Text>
              <CheckBox
                checkedIcon={
                  <MaterialCommunityIcons
                    name="check"
                    size={24}
                    color="green"
                  />
                }
                uncheckedIcon={
                  <MaterialCommunityIcons name="plus" size={24} color="green" />
                }
                checked={toppingChecked[topping.id] || false}
                onPress={() =>
                  setToppingChecked((prev) => ({
                    ...prev,
                    [topping.id]: !prev[topping.id],
                  }))
                }
              />
            </View>
          </View>
        ))
      ) : (
        <Text style={{ fontWeight: "bold", textAlign: "center" }}>
          Món này không có topping
        </Text>
      )}

      <View style={Styles.quantityContainer}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={Styles.quantityLabel}>Số lượng:</Text>
          <View style={Styles.quantityButtonGroup}>
            <TouchableOpacity
              onPress={decrementQuantity}
              style={Styles.quantityButton}
            >
              <MaterialCommunityIcons name="minus" size={20} color="black" />
            </TouchableOpacity>
            <Text style={Styles.quantityText}>{quantity}</Text>
            <TouchableOpacity
              onPress={incrementQuantity}
              style={Styles.quantityButton}
            >
              <MaterialCommunityIcons name="plus" size={20} color="black" />
            </TouchableOpacity>
          </View>
        </View>
        <Button
          radius="sm"
          type="solid"
          buttonStyle={{
            backgroundColor: "#60D160",
            paddingHorizontal: 20,
            paddingVertical: 10,
          }}
          title="Đặt hàng"
          containerStyle={Styles.orderButtonContainer}
          icon={
            <MaterialCommunityIcons
              name="cart"
              size={20}
              color="white"
              style={{ marginLeft: 10 }}
            />
          }
          iconRight
          onPress={() => handleOrder()}
          titleStyle={{ marginRight: 10, color: "white" }}
        />
      </View>
    </ScrollView>
  );
};

const formatPrice = (price) => {
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export default FoodShown;
