import { router } from "expo-router";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View, ScrollView } from "react-native";
import { useAppTheme } from "@/core/theme/ThemeProvider";
import { useMotivations } from "@/features/motivations/useMotivations";
import { ClayButton } from "@/ui/primitives/ClayButton";
import { ClayCard } from "@/ui/primitives/ClayCard";

function makeStyles(colors: any) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: "transparent" },
    container: { flex: 1, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32 },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
    title: { fontFamily: "Sora", fontWeight: "700", fontSize: 22, color: colors.text },
    empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, paddingHorizontal: 24 },
    emptyTitle: { fontFamily: "Sora", fontWeight: "700", fontSize: 20, color: colors.text, textAlign: "center" },
    emptyDesc: { fontFamily: "Plus Jakarta Sans", fontSize: 15, color: colors.textMuted, textAlign: "center" },
    card: { width: 280, marginRight: 16 },
    cardContent: { padding: 16, gap: 8 },
    text: { fontFamily: "Plus Jakarta Sans", fontSize: 14, color: colors.text, textAlign: "center", lineHeight: 20 },
    author: { fontFamily: "JetBrains Mono", fontSize: 11, color: colors.textMuted, textAlign: "center" },
    actions: { flexDirection: "row", justifyContent: "center", gap: 8, marginTop: 4 },
  });
}

export default function MotivationsModal() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { data: motivationsData } = useMotivations();
  const motivations = motivationsData ?? [];

  if (motivations.length === 0) {
    return (
      <View style={styles.screen}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Motivaciones</Text>
            <ClayButton label="+ Crear" variant="secondary" onPress={() => router.push("/(modals)/new-motivacion")} />
          </View>
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Sin motivaciones aun</Text>
            <Text style={styles.emptyDesc}>Crea tu primera frase para que aparezca en Hoy.</Text>
            <ClayButton label="Crear motivacion" onPress={() => router.push("/(modals)/new-motivacion")} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Motivaciones</Text>
          <ClayButton label="+ Crear" variant="secondary" onPress={() => router.push("/(modals)/new-motivacion")} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24, paddingHorizontal: 16 }}>
          {motivations.map((item) => (
            <View style={{ width: 280, marginRight: 16 }} key={item.id}>
              <ClayCard style={{ padding: 16, gap: 8 }}>
                <Text style={{ fontSize: 28, textAlign: "center" }}>{item.emoji}</Text>
                <Text style={{ fontFamily: "Plus Jakarta Sans", fontSize: 14, color: colors.text, textAlign: "center", lineHeight: 20 }} numberOfLines={3}>{item.text}</Text>
                <Text style={{ fontFamily: "JetBrains Mono", fontSize: 11, color: colors.textMuted, textAlign: "center" }}>- {item.goalId ? "Meta" : "Inspiracion"}</Text>
                <View style={{ flexDirection: "row", justifyContent: "center", gap: 8, marginTop: 4 }}>
                  <Pressable onPress={() => router.push({ pathname: "/(modals)/new-motivacion", params: { motivationId: item.id } })} style={{ padding: 6 }}>
                    <Text style={{ color: colors.primary, fontWeight: "600" }}>Editar</Text>
                  </Pressable>
                </View>
              </ClayCard>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}