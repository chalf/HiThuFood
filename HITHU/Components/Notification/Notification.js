import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ImageBackground,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from "react-native";
import AppStyles from "../../Styles/AppStyles";
import Styles from "./Styles";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { endpoints, authAPI } from "../../configs/APIs";
import { Badge } from "@rneui/themed";

const backGround = require("../../Templates/Images/BackGround.png");

const Notification = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchOrders = async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      const api = authAPI(token);
      const response = await api.get(endpoints["store-order"]);
      setOrders(response.data);
      console.log(response.data);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError("Failed to load orders. Please try again later.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  if (loading) {
    return (
      <View style={Styles.centered}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={Styles.centered}>
        <Text style={Styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ImageBackground source={backGround} style={AppStyles.background}>
      <View>
        <Text style={Styles.h1}>Thông Báo</Text>
      </View>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View>
          {orders && orders.length > 0 ? (
            orders.map((order, index) => (
              <TouchableOpacity
                key={index}
                style={[Styles.box, AppStyles.flex]}
                onPress={() => console.log(`Order ID: ${order.id}`)}
              >
                {order.status === "PENDING" && (
                  <Badge
                    value="Đang chờ"
                    status="error"
                    containerStyle={{
                      position: "absolute",
                      top: -4,
                      right: -4,
                    }}
                  />
                )}
                <View style={Styles.textContainer}>
                  <Text style={Styles.orderTitle}>Đơn hàng:</Text>
                  <Text style={Styles.orderDetail}>
                    Mã đơn hàng: {order.id}
                  </Text>
                  <Text style={Styles.orderDetail}>
                    Khách hàng: {order.user}
                  </Text>
                  <Text style={Styles.orderDetail}>
                    Tổng thanh toán: {formatPrice(order.total)} đ
                  </Text>
                  <Text style={Styles.orderDetail}>
                    Trạng thái:{" "}
                    {order.status === "PENDING" ? "Đang chờ" : order.status}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={{ fontWeight: "bold", textAlign: "center" }}>
              Không có thông báo nào.
            </Text>
          )}
        </View>
      </ScrollView>
    </ImageBackground>
  );
};

const formatPrice = (price) => {
  const priceString = price.toString();
  const formattedPrice = priceString.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return formattedPrice;
};

export default Notification;
