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
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { FontAwesome5 } from "@expo/vector-icons";
import { Audio } from "expo-av";

// CONTEXT
import { useStateContext } from "../../context";

// COMPONENT
import { Loader } from "../../components";

export default function SummarizedNotes() {
  const navigation = useNavigation();
  const { transcript, summary, setSummary, audioFile } = useStateContext();
  //   const [summary, setSummary] = useState();
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [selectedTab, setSelectedTab] = useState("Summary");
  const [sound, setSound] = useState();

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

  async function playSound() {
    const { sound } = await Audio.Sound.createAsync(
      { uri: audioFile },
      { shouldPlay: true }
    );
    setSound(sound);
  }

  async function pauseSound() {
    if (sound) {
      await sound.pauseAsync();
    }
  }

  return (
    <>
      {!isSummarizing && (
        <SafeAreaView style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.back}
                onPress={() => navigation.navigate("Transcribe")}
              >
                <Ionicons name="ios-chevron-back" size={24} color="white" />
              </TouchableOpacity>
              <Text style={styles.headerText}>Note</Text>
            </View>

            {/* Tabs */}
            <View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity
                  onPress={() => setSelectedTab("Summary")}
                  style={{
                    ...styles.card,
                    backgroundColor:
                      selectedTab === "Summary" ? "#86C7ED" : "#426174",
                  }}
                >
                  <Text>Summary</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setSelectedTab("Transcript")}
                  style={{
                    ...styles.card,
                    backgroundColor:
                      selectedTab === "Transcript" ? "#86C7ED" : "#426174",
                  }}
                >
                  <Text>Transcript</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setSelectedTab("Audio")}
                  style={{
                    ...styles.card,
                    backgroundColor:
                      selectedTab === "Audio" ? "#86C7ED" : "#426174",
                  }}
                >
                  <Text>Audio</Text>
                </TouchableOpacity>
                {/* Add more cards as needed */}
              </ScrollView>
            </View>
            {/* Tabs */}

            {summary && selectedTab === "Summary" && (
              <Text style={styles.notes}>{summary}</Text>
            )}
            {transcript && selectedTab === "Transcript" && (
              <Text style={styles.notes}>{transcript}</Text>
            )}
            {audioFile && selectedTab === "Audio" && (
              //   <Text style={styles.notes}>{audioFile}</Text>
              <>
                <TouchableOpacity
                  style={{
                    alignSelf: "center",
                    width: "40%",
                    height: 50,
                    borderRadius: 30,
                    backgroundColor: "#86C7ED",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    marginTop: 20,
                    flexDirection: "row",
                    gap: 10,
                  }}
                  onPress={playSound}
                >
                  <Text
                    style={{
                      color: "#1F1B24",
                      fontSize: 16,
                    }}
                  >
                    Play
                  </Text>
                  <FontAwesome5 name="play" size={14} color="#1F1B24" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    alignSelf: "center",
                    width: "40%",
                    height: 50,
                    borderRadius: 30,
                    backgroundColor: "#86C7ED",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    marginTop: 20,
                    flexDirection: "row",
                    gap: 10,
                  }}
                  onPress={pauseSound}
                >
                  <Text
                    style={{
                      color: "#1F1B24",
                      fontSize: 16,
                    }}
                  >
                    Stop
                  </Text>
                  <Ionicons name="stop" size={16} color="#1F1B24" />
                </TouchableOpacity>
              </>
            )}
            <View style={styles.bottom}></View>
          </ScrollView>
        </SafeAreaView>
      )}
      {isSummarizing && <Loader title={"Getting Notes"} />}
      <StatusBar style="light" />
    </>
  );
}

const styles = StyleSheet.create({
  bottom: {
    height: 30,
  },
  container: {
    flex: 1,
    backgroundColor: "#1F1B24",
  },
  notes: {
    width: "80%",
    alignSelf: "center",
    fontSize: 16,
    color: "white",
    marginTop: 20,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  title: {
    fontSize: 32,
    textAlign: "center",
    marginTop: 20,
    marginBottom: 20,
    color: "white",
  },
  back: {
    flex: 0.4,
    marginLeft: "10%",
  },
  header: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    marginVertical: "5%",
  },
  headerText: {
    fontSize: 24,
    color: "white",
  },
  card: {
    width: 100,
    height: 40,
    // backgroundColor: "#86c7ed",
    borderRadius: 20,
    margin: 10,
    justifyContent: "center",
    alignItems: "center",
  },
});
