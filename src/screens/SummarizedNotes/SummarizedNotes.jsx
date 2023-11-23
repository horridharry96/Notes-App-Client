import {
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  View,
} from "react-native";
import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";

// CONTEXT
import { useStateContext } from "../../context";

// COMPONENT
import { Loader } from "../../components";

export default function SummarizedNotes() {
  const navigation = useNavigation();
  const { transcript } = useStateContext();
  const [summary, setSummary] = useState();
  const [isSummarizing, setIsSummarizing] = useState(false);

  useEffect(() => {
    if (transcript.length === 0) {
      navigation.navigate("Transcribe");
    }
    if (transcript.length > 0) {
      getNotes();
    }
  }, []);

  const getNotes = async () => {
    try {
      setIsSummarizing(true);
      const prompt = {
        content: transcript,
      };
      const { data } = await axios.post(
        "https://notesappserver-dev-emhk.4.us-1.fl0.io/api/transcribe/notes", // PRODUCTION URL
        // "http://192.168.10.4:8080/api/transcribe/notes", // DEV URL
        prompt,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      setSummary(data);
      setIsSummarizing(false);
    } catch (error) {
      console.log(error.response.data);
      setIsSummarizing(false);
    }
  };

  return (
    <>
      {!isSummarizing && (
        <SafeAreaView style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <Text style={styles.title}>Notes</Text>
            {summary && <Text style={styles.notes}>{summary}</Text>}
            <View style={styles.bottom}></View>
          </ScrollView>
        </SafeAreaView>
      )}
      {isSummarizing && <Loader title={"Getting Notes"} />}
    </>
  );
}

const styles = StyleSheet.create({
  bottom: {
    height: 30,
  },
  container: {
    flex: 1,
  },
  notes: {
    width: "80%",
    alignSelf: "center",
    fontSize: 16,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  title: {
    fontSize: 32,
    textAlign: "center",
    marginTop: 20,
    marginBottom: 20,
  },
});
