import { ActionLabel } from '@/components/ActionLabel';
import { useCallback, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useCurrentTechnicianOffer,
  useCurrentUser,
  useUpdateCurrentTechnicianOffer,
} from '@servicienta/query-hooks';
import type {
  TechnicianOffer,
  TechnicianOfferSpecialty,
} from '@servicienta/types';
import { useAuth } from '@/features/auth/AuthProvider';
import { colors } from '@/theme/colors';

export function TechnicianProfileScreen() {
  const { data, error, isLoading, refetch } = useCurrentTechnicianOffer();
  const { data: user } = useCurrentUser();
  const update = useUpdateCurrentTechnicianOffer();
  const { signOut } = useAuth();
  const [draft, setDraft] = useState<TechnicianOffer | null>(null);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [saveError, setSaveError] = useState('');
  const [signingOut, setSigningOut] = useState(false);
  const saving = useRef(false);
  const offer = draft ?? data?.offer;
  const disabled = update.isPending || signingOut;

  // Refetch changes made on web without replacing a local draft.
  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  function edit(transform: (current: TechnicianOffer) => TechnicianOffer) {
    if (disabled || !offer) return;
    setDraft(transform(offer));
    setMessage('');
    setSaveError('');
  }
  function toggleZone(id: string) {
    edit((current) => ({ ...current, zoneIds: toggleId(current.zoneIds, id) }));
  }
  function toggleAppliance(id: string) {
    edit((current) => ({
      ...current,
      specialties: current.specialties.some(
        (item) => item.applianceTypeId === id,
      )
        ? current.specialties.filter((item) => item.applianceTypeId !== id)
        : [
            ...current.specialties,
            { applianceTypeId: id, supportsAllBrands: true, brandIds: [] },
          ],
    }));
  }
  function editSpecialty(id: string, patch: Partial<TechnicianOfferSpecialty>) {
    edit((current) => ({
      ...current,
      specialties: current.specialties.map((item) =>
        item.applianceTypeId === id ? { ...item, ...patch } : item,
      ),
    }));
  }
  function save() {
    if (!offer || saving.current || disabled) return;
    setMessage('');
    setSaveError('');
    if (
      offer.specialties.some(
        (item) => !item.supportsAllBrands && !item.brandIds.length,
      )
    ) {
      setSaveError(
        'Elegí al menos una marca por electrodoméstico o activá “Todas las marcas”.',
      );
      return;
    }
    saving.current = true;
    update.mutate(offer, {
      onSuccess: () => {
        setDraft(null);
        setMessage('Oferta guardada. Los cambios ya se reflejan en web.');
      },
      onError: (error) =>
        setSaveError(
          error instanceof Error
            ? error.message
            : 'No se pudo guardar la oferta.',
        ),
      onSettled: () => {
        saving.current = false;
      },
    });
  }
  async function logout() {
    if (disabled) return;
    setSigningOut(true);
    setSaveError('');
    try {
      await signOut();
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : 'No se pudo cerrar sesión.',
      );
    } finally {
      setSigningOut(false);
    }
  }

  if (isLoading)
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} />
        <Text style={styles.copy}>Cargando perfil…</Text>
      </View>
    );
  if (!data || !offer)
    return (
      <View style={styles.centered}>
        <Text accessibilityRole="alert" style={styles.error}>
          {error instanceof Error
            ? error.message
            : 'No se pudo cargar tu oferta.'}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => void refetch()}
          style={styles.secondary}
        >
          <ActionLabel icon="refresh-outline" textStyle={styles.buttonText}>
            Reintentar
          </ActionLabel>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={signingOut}
          onPress={() => void logout()}
          style={styles.secondary}
        >
          <ActionLabel icon="log-out-outline" textStyle={styles.buttonText}>
            Cerrar sesión
          </ActionLabel>
        </Pressable>
        {saveError ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {saveError}
          </Text>
        ) : null}
      </View>
    );

  const zones = data.catalogs.zones.filter((zone) =>
    normalize(zone.name).includes(normalize(search)),
  );
  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : Platform.OS === 'android'
              ? 'height'
              : undefined
        }
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View style={styles.section}>
            <Text style={styles.eyebrow}>Cuenta técnica</Text>
            <Text style={styles.title}>Mi perfil</Text>
            <Text style={styles.copy}>{user?.email}</Text>
            <Text style={styles.copy}>
              Elegí dónde trabajás y qué electrodomésticos atendés.
            </Text>
          </View>
          {error ? (
            <Text accessibilityRole="alert" style={styles.error}>
              No pudimos actualizar el perfil. Se muestran los últimos datos
              cargados.
            </Text>
          ) : null}
          <View style={styles.card}>
            <View style={styles.switchRow}>
              <View style={styles.switchText}>
                <Text style={styles.heading}>Disponibilidad</Text>
                <Text style={styles.copy}>
                  {offer.available
                    ? 'Disponible para recibir pedidos'
                    : 'No disponible para nuevos pedidos'}
                </Text>
              </View>
              <Switch
                accessibilityLabel="Disponible para recibir pedidos"
                value={offer.available}
                disabled={disabled}
                onValueChange={(available) =>
                  edit((current) => ({ ...current, available }))
                }
                trackColor={{ false: colors.border, true: colors.accent }}
              />
            </View>
            <Text style={styles.copy}>
              Guardá los cambios para actualizar tu disponibilidad.
            </Text>
            {!offer.zoneIds.length || !offer.specialties.length ? (
              <Text style={styles.copy}>
                Completá zonas y electrodomésticos para aparecer en la búsqueda.
              </Text>
            ) : null}
          </View>
          <View style={styles.card}>
            <Text style={styles.heading}>Localidades y barrios</Text>
            <Text style={styles.copy}>
              {offer.zoneIds.length} seleccionados
            </Text>
            <TextInput
              accessibilityLabel="Buscar localidad o barrio"
              placeholder="Buscar localidad o barrio"
              placeholderTextColor={colors.muted}
              value={search}
              onChangeText={setSearch}
              style={styles.input}
              autoCorrect={false}
            />
            <View style={styles.options}>
              {zones.map((zone) => (
                <Choice
                  key={zone.id}
                  label={zone.name}
                  selected={offer.zoneIds.includes(zone.id)}
                  disabled={disabled}
                  onPress={() => toggleZone(zone.id)}
                />
              ))}
            </View>
            {!zones.length ? (
              <Text style={styles.copy}>
                No hay zonas que coincidan con la búsqueda.
              </Text>
            ) : null}
          </View>
          <View style={styles.card}>
            <Text style={styles.heading}>Electrodomésticos y marcas</Text>
            <Text style={styles.copy}>
              {offer.specialties.length} electrodomésticos seleccionados
            </Text>
            {data.catalogs.applianceTypes.map((appliance) => {
              const specialty = offer.specialties.find(
                (item) => item.applianceTypeId === appliance.id,
              );
              return (
                <View key={appliance.id} style={styles.specialty}>
                  <Choice
                    label={appliance.name}
                    selected={Boolean(specialty)}
                    disabled={disabled}
                    onPress={() => toggleAppliance(appliance.id)}
                  />
                  {specialty ? (
                    <View style={styles.brands}>
                      <View style={styles.switchRow}>
                        <Text style={[styles.copy, styles.switchText]}>
                          Todas las marcas
                        </Text>
                        <Switch
                          accessibilityLabel={`Todas las marcas de ${appliance.name}`}
                          value={specialty.supportsAllBrands}
                          disabled={disabled}
                          onValueChange={(supportsAllBrands) =>
                            editSpecialty(appliance.id, {
                              supportsAllBrands,
                              brandIds: supportsAllBrands
                                ? []
                                : specialty.brandIds,
                            })
                          }
                          trackColor={{
                            false: colors.border,
                            true: colors.accent,
                          }}
                        />
                      </View>
                      {!specialty.supportsAllBrands ? (
                        <View style={styles.options}>
                          {data.catalogs.brands.map((brand) => (
                            <Choice
                              key={brand.id}
                              label={brand.name}
                              selected={specialty.brandIds.includes(brand.id)}
                              disabled={disabled}
                              onPress={() =>
                                editSpecialty(appliance.id, {
                                  brandIds: toggleId(
                                    specialty.brandIds,
                                    brand.id,
                                  ),
                                })
                              }
                            />
                          ))}
                        </View>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
          <Pressable
            accessibilityRole="button"
            disabled={disabled}
            onPress={() => void logout()}
            style={styles.secondary}
          >
            {signingOut ? <ActivityIndicator color={colors.text} /> : null}
            <ActionLabel icon="log-out-outline" textStyle={styles.buttonText}>
              Cerrar sesión
            </ActionLabel>
          </Pressable>
        </ScrollView>
        <View style={styles.footer}>
          {message ? (
            <Text
              accessibilityRole="text"
              accessibilityLiveRegion="polite"
              style={styles.success}
            >
              {message}
            </Text>
          ) : null}
          {saveError ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {saveError}
            </Text>
          ) : null}
          {draft ? <Text style={styles.copy}>Cambios sin guardar</Text> : null}
          <Pressable
            accessibilityRole="button"
            accessibilityState={{
              disabled: disabled || !draft,
              busy: update.isPending,
            }}
            disabled={disabled || !draft}
            onPress={save}
            style={[styles.primary, (disabled || !draft) && styles.disabled]}
          >
            {update.isPending ? (
              <ActivityIndicator color={colors.text} />
            ) : null}
            <ActionLabel icon="save-outline" textStyle={styles.buttonText}>
              {update.isPending ? 'Guardando…' : 'Guardar oferta'}
            </ActionLabel>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Choice({
  label,
  selected,
  disabled,
  onPress,
}: {
  label: string;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.choice, selected && styles.selected]}
    >
      <Ionicons
        name={selected ? 'checkbox' : 'square-outline'}
        size={22}
        color={selected ? colors.accent : colors.muted}
        accessible={false}
      />
      <Text style={styles.choiceText}>{label}</Text>
    </Pressable>
  );
}
function toggleId(ids: string[], id: string) {
  return ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id];
}
function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    padding: 24,
    backgroundColor: colors.background,
  },
  content: { padding: 20, gap: 20, paddingBottom: 32 },
  section: { gap: 10 },
  eyebrow: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  title: { color: colors.text, fontSize: 32, fontWeight: '900' },
  heading: { color: colors.text, fontSize: 19, fontWeight: '800' },
  copy: { color: colors.muted, lineHeight: 22 },
  card: {
    padding: 18,
    gap: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
  },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  switchText: { flex: 1, gap: 6 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
  },
  selected: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(39,180,126,0.08)',
  },
  choiceText: { color: colors.text, flexShrink: 1 },
  specialty: { gap: 10 },
  brands: { paddingLeft: 12, gap: 10 },
  input: {
    minHeight: 48,
    color: colors.text,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.background,
  },
  footer: {
    padding: 16,
    gap: 10,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  primary: {
    minHeight: 52,
    padding: 14,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.accent,
  },
  secondary: {
    minHeight: 52,
    padding: 14,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonText: { color: colors.text, fontWeight: '800', fontSize: 16 },
  disabled: { opacity: 0.5 },
  error: { color: '#ff8d87', lineHeight: 22 },
  success: { color: colors.accent, lineHeight: 22 },
});
