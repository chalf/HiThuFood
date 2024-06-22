import { StyleSheet } from "react-native";

export default StyleSheet.create({
  h1: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
  },
  avatar: {
    width: 100,
    height: 100,
    marginLeft: 20,
    margin: 20,
    borderRadius: 50,
  },
  storename: {
    fontSize: 20,
    fontWeight: "bold",
  },
  foodimage: {
    width: 100,
    height: 100,
    margin: 10,
  },
  box: {
    borderWidth: 1,
    borderColor: "grey",
    margin: 5,
    borderRadius: 5,
    flexDirection: 'row', // Ensure the box content aligns in a row
    alignItems: 'center', // Center the items vertically
    flex: 1, // Allow the box to expand flexibly
  },
  textContainer: {
    flex: 1, // Allow the text container to take up the remaining space
    marginLeft: 10, // Add some space between the image and the text
  },
  foodname: {
    fontSize: 18,
    fontWeight: "bold",
    flexWrap: 'wrap', // Enable text wrapping
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
  },
  h1: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
  },
  box: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    margin: 10,
  },
  orderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  orderDetail: {
    fontSize: 16,
  },
  textContainer: {
    paddingLeft: 10,
  },
});
