import { Redirect } from "expo-router";
import { StatusBar } from "react-native";

export default function Index() {
  return (
    <>
      <StatusBar hidden={true} />
      <Redirect href="/auth/login" />
    </>
  );
}
