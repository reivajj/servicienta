import { ActionLabel } from '@/components/ActionLabel';
import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useCreateOrder,
  usePublicTechnicianProfileCatalogs,
  usePublicTechnicianProfiles,
} from '@servicienta/query-hooks';
import type {
  ListPublicTechnicianProfilesInput,
  PublicTechnicianProfile,
} from '@servicienta/types';
import { formatPersonName } from '@/lib/format';
import { colors } from '@/theme/colors';

export function TechnicianSearchScreen({
  header,
  onRefresh,
  refreshing = false,
}: {
  header?: ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
}) {
  const router = useRouter();
  const {
    data: catalogs,
    error: catalogError,
    isLoading,
    refetch: refetchCatalogs,
  } = usePublicTechnicianProfileCatalogs();
  const [zone, setZone] = useState('');
  const [appliance, setAppliance] = useState('');
  const [input, setInput] = useState<ListPublicTechnicianProfilesInput | null>(
    null,
  );
  const {
    data: profiles,
    error,
    isFetching,
    refetch,
  } = usePublicTechnicianProfiles(input);
  const [selected, setSelected] = useState<PublicTechnicianProfile | null>(
    null,
  );
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState('');
  const createOrder = useCreateOrder();
  const creating = useRef(false);
  const availableSlugs = catalogs?.applianceTypeSlugsByZone[zone] ?? [];
  const appliances =
    catalogs?.applianceTypes.filter((item) =>
      availableSlugs.includes(item.slug),
    ) ?? [];
  const canSearch = Boolean(
    zone && appliance && availableSlugs.includes(appliance),
  );

  function request() {
    if (!selected || !input || creating.current) return;
    if (!description.trim() || !address.trim()) {
      setMessage('Completá el problema y la dirección del servicio.');
      return;
    }
    creating.current = true;
    setMessage('');
    createOrder.mutate(
      {
        technician_public_slug: selected.public_slug,
        zone_slug: input.zoneSlug,
        appliance_type_slug: input.applianceTypeSlug,
        description: description.trim(),
        service_address_text: address.trim(),
        address_notes: notes.trim() || null,
        service_lat: null,
        service_lng: null,
      },
      {
        onSuccess: (response) => {
          setSelected(null);
          router.push({
            pathname: '/orders/[orderId]',
            params: { orderId: response.data.id },
          });
        },
        onError: (error) =>
          setMessage(
            error instanceof Error
              ? error.message
              : 'No se pudo crear el pedido.',
          ),
        onSettled: () => {
          creating.current = false;
        },
      },
    );
  }

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.screen}>
      <ScrollView
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent}
            />
          ) : undefined
        }
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {header}
        <Text style={styles.eyebrow}>Encontrá ayuda para tu hogar</Text>
        <Text style={styles.title}>Buscar técnicos</Text>
        <Text style={styles.copy}>
          Elegí tu localidad o barrio y el electrodoméstico que necesita
          reparación.
        </Text>
        {isLoading ? <ActivityIndicator color={colors.accent} /> : null}
        {catalogError ? (
          <View style={styles.card}>
            <Text accessibilityRole="alert" style={styles.error}>
              {catalogError instanceof Error
                ? catalogError.message
                : 'No pudimos cargar los filtros.'}
            </Text>
            <Pressable
              accessibilityRole="button"
              style={styles.secondary}
              onPress={() => void refetchCatalogs()}
            >
              <ActionLabel icon="refresh-outline" textStyle={styles.buttonText}>
                Reintentar
              </ActionLabel>
            </Pressable>
          </View>
        ) : null}
        {catalogs ? (
          <View style={styles.card}>
            <CatalogSelector
              label="Localidad o barrio"
              value={zone}
              items={catalogs.zones}
              onChange={(slug) => {
                setZone(slug);
                setAppliance('');
                setInput(null);
              }}
            />
            <CatalogSelector
              label="Electrodoméstico"
              value={appliance}
              items={appliances}
              disabled={!zone || !appliances.length}
              onChange={(slug) => {
                setAppliance(slug);
                setInput(null);
              }}
            />
            {zone && !appliances.length ? (
              <Text style={styles.copy}>
                Todavía no hay técnicos disponibles en esta zona.
              </Text>
            ) : null}
            <Pressable
              accessibilityRole="button"
              disabled={!canSearch || isFetching}
              onPress={() => {
                if (
                  input?.zoneSlug === zone &&
                  input.applianceTypeSlug === appliance
                )
                  void refetch();
                else setInput({ zoneSlug: zone, applianceTypeSlug: appliance });
              }}
              style={[
                styles.primary,
                (!canSearch || isFetching) && styles.disabled,
              ]}
            >
              {isFetching ? <ActivityIndicator color={colors.text} /> : null}
              <ActionLabel icon="search-outline" textStyle={styles.buttonText}>
                {isFetching ? 'Buscando…' : 'Buscar técnicos'}
              </ActionLabel>
            </Pressable>
          </View>
        ) : null}
        {input && error ? (
          <View style={styles.card}>
            <Text accessibilityRole="alert" style={styles.error}>
              {error instanceof Error
                ? error.message
                : 'No se pudieron cargar los técnicos.'}
            </Text>
            <Pressable
              accessibilityRole="button"
              style={styles.secondary}
              onPress={() => void refetch()}
            >
              <ActionLabel icon="refresh-outline" textStyle={styles.buttonText}>
                Reintentar
              </ActionLabel>
            </Pressable>
          </View>
        ) : null}
        {input && !isFetching && !error && profiles ? (
          <Text style={styles.heading}>
            {profiles.length
              ? `${profiles.length} técnicos encontrados`
              : 'No encontramos técnicos para esta búsqueda'}
          </Text>
        ) : null}
        {input && !error
          ? profiles?.map((profile) => (
              <View key={profile.public_slug} style={styles.card}>
                <Text style={styles.heading}>
                  {formatPersonName(profile.name, profile.surname)}
                </Text>
                <Text style={styles.copy}>
                  {profile.rating_count
                    ? `${profile.rating.toFixed(1)} ★ · ${profile.rating_count} opiniones`
                    : 'Todavía sin opiniones'}
                  {profile.verified_at ? ' · Verificado' : ''}
                </Text>
                {profile.bio ? (
                  <Text style={styles.copy}>{profile.bio}</Text>
                ) : null}
                <Pressable
                  accessibilityRole="button"
                  disabled={!profile.available}
                  onPress={() => {
                    setSelected(profile);
                    setDescription('');
                    setAddress('');
                    setNotes('');
                    setMessage('');
                  }}
                  style={[
                    styles.primary,
                    !profile.available && styles.disabled,
                  ]}
                >
                  <ActionLabel
                    icon="add-circle-outline"
                    textStyle={styles.buttonText}
                  >
                    {profile.available ? 'Solicitar servicio' : 'No disponible'}
                  </ActionLabel>
                </Pressable>
              </View>
            ))
          : null}
      </ScrollView>
      <Modal
        visible={Boolean(selected)}
        animationType="slide"
        onRequestClose={() => {
          if (!creating.current) setSelected(null);
        }}
      >
        <SafeAreaView style={styles.screen}>
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
            >
              <Text style={styles.title}>Solicitar servicio</Text>
              <Text style={styles.heading}>
                {selected
                  ? formatPersonName(selected.name, selected.surname)
                  : ''}
              </Text>
              <Text style={styles.copy}>
                El técnico recibirá tu pedido para aceptarlo y coordinar la
                visita.
              </Text>
              <Text style={styles.copy}>Problema del electrodoméstico</Text>
              <TextInput
                accessibilityLabel="Problema del electrodoméstico"
                multiline
                value={description}
                onChangeText={setDescription}
                editable={!createOrder.isPending}
                style={[styles.field, styles.multiline]}
              />
              <Text style={styles.copy}>Dirección del servicio</Text>
              <TextInput
                accessibilityLabel="Dirección del servicio"
                value={address}
                onChangeText={setAddress}
                editable={!createOrder.isPending}
                style={styles.field}
              />
              <Text style={styles.copy}>
                Indicaciones adicionales (opcional)
              </Text>
              <TextInput
                accessibilityLabel="Indicaciones adicionales"
                multiline
                value={notes}
                onChangeText={setNotes}
                editable={!createOrder.isPending}
                style={styles.field}
              />
              {message ? (
                <Text accessibilityRole="alert" style={styles.error}>
                  {message}
                </Text>
              ) : null}
              <Pressable
                accessibilityRole="button"
                disabled={createOrder.isPending}
                onPress={request}
                style={[
                  styles.primary,
                  createOrder.isPending && styles.disabled,
                ]}
              >
                {createOrder.isPending ? (
                  <ActivityIndicator color={colors.text} />
                ) : null}
                <ActionLabel icon="send-outline" textStyle={styles.buttonText}>
                  {createOrder.isPending ? 'Enviando…' : 'Enviar pedido'}
                </ActionLabel>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={createOrder.isPending}
                onPress={() => setSelected(null)}
                style={styles.secondary}
              >
                <ActionLabel
                  icon="arrow-back-outline"
                  textStyle={styles.buttonText}
                >
                  Volver
                </ActionLabel>
              </Pressable>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function CatalogSelector({
  label,
  value,
  items,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  items: { id: string; slug: string; name: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const normalized = (text: string) =>
    text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  const visible = items.filter((item) =>
    normalized(item.name).includes(normalized(search)),
  );
  return (
    <>
      <Text style={styles.copy}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        disabled={disabled}
        onPress={() => {
          setSearch('');
          setOpen(true);
        }}
        style={[styles.selector, disabled && styles.disabled]}
      >
        <Text style={styles.buttonText}>
          {items.find((item) => item.slug === value)?.name ?? 'Seleccionar'}
        </Text>
        <Ionicons name="chevron-down" size={20} color={colors.muted} />
      </Pressable>
      <Modal
        visible={open}
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <SafeAreaView style={styles.screen}>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.title}>{label}</Text>
            <TextInput
              accessibilityLabel={`Buscar ${label.toLowerCase()}`}
              placeholder="Buscar"
              placeholderTextColor={colors.muted}
              value={search}
              onChangeText={setSearch}
              style={styles.field}
            />
            {visible.map((item) => (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityState={{ selected: value === item.slug }}
                onPress={() => {
                  onChange(item.slug);
                  setOpen(false);
                }}
                style={styles.secondary}
              >
                <Text style={styles.buttonText}>{item.name}</Text>
                {value === item.slug ? (
                  <Ionicons name="checkmark" size={20} color={colors.accent} />
                ) : null}
              </Pressable>
            ))}
            {!visible.length ? (
              <Text style={styles.copy}>Sin coincidencias.</Text>
            ) : null}
            <Pressable
              accessibilityRole="button"
              onPress={() => setOpen(false)}
              style={styles.secondary}
            >
              <ActionLabel icon="close-outline" textStyle={styles.buttonText}>
                Cerrar
              </ActionLabel>
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 16 },
  eyebrow: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  title: { color: colors.text, fontSize: 30, fontWeight: '900' },
  heading: { color: colors.text, fontSize: 20, fontWeight: '800' },
  copy: { color: colors.muted, lineHeight: 22 },
  card: {
    padding: 18,
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  primary: {
    minHeight: 52,
    padding: 14,
    backgroundColor: colors.accent,
    borderRadius: 14,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondary: {
    minHeight: 48,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selector: {
    minHeight: 52,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  field: {
    minHeight: 52,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  multiline: { minHeight: 100, textAlignVertical: 'top' },
  buttonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    flexShrink: 1,
  },
  disabled: { opacity: 0.5 },
  error: { color: '#ff8d87', lineHeight: 22 },
});
