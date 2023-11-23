import { StyleSheet, Text, View } from "react-native";
import React from "react";

// NAVIGATION
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer } from "@react-navigation/native";
const Stack = createNativeStackNavigator();

// SCREENS
import { Transcribe, SummarizedNotes } from "../screens";

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          animation: "slide_from_right",
        }}
        initialRouteName="Transcribe"
      >
        <Stack.Screen
          name="Transcribe"
          component={Transcribe}
          options={{ headerShown: false, animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="SummarizedNotes"
          component={SummarizedNotes}
          options={{ headerShown: false, animation: "slide_from_right" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({});
