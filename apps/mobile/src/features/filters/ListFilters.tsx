import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VisitCalendar } from '@/features/chat/VisitCalendar';
import { colors } from '@/theme/colors';
import { argentinaDay } from '@/features/today/agenda';
import { quickDateRange } from './dates';

export interface Filters<T extends string> {
  search?: string;
  status?: T;
  date_from?: string;
  date_to?: string;
}

export function useListFilters<T extends string>() {
  const [filters, setFilters] = useState<Filters<T>>({});
  const [page, setPage] = useState(1);
  function change(next: Filters<T>) {
    setFilters(next);
    setPage(1);
  }
  return { filters, change, page, setPage };
}

export function ListFilters<T extends string>({
  value,
  onChange,
  statuses,
  dateLabel,
  searchHint,
}: {
  value: Filters<T>;
  onChange: (value: Filters<T>) => void;
  statuses: { value: T; label: string }[];
  dateLabel: string;
  searchHint: string;
}) {
  const [panel, setPanel] = useState<'search' | 'status' | 'date' | null>(null);
  const [draft, setDraft] = useState(value);
  const [calendarField, setCalendarField] = useState<'date_from' | 'date_to'>(
    'date_from',
  );
  const [error, setError] = useState('');
  function open(next: typeof panel) {
    setDraft(value);
    setError('');
    setCalendarField('date_from');
    setPanel(next);
  }
  function apply() {
    const search = draft.search?.trim() || undefined;
    if (search && search.length < 3) {
      setError('Escribí al menos 3 caracteres.');
      return;
    }
    if (draft.date_from && draft.date_to && draft.date_from > draft.date_to) {
      setError('La fecha final debe ser igual o posterior a la inicial.');
      return;
    }
    Keyboard.dismiss();
    onChange({ ...draft, search });
    setPanel(null);
  }
  function choice(label: string, onPress: () => void, selected = false) {
    return (
      <Pressable
        key={label}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        onPress={onPress}
        style={[styles.choice, selected && styles.selected]}
      >
        <Text style={styles.text}>{label}</Text>
      </Pressable>
    );
  }
  return (
    <View style={styles.group}>
      <View style={styles.toolbar}>
        {(
          [
            {
              key: 'search',
              icon: 'search-outline',
              label: value.search ? 'Buscar •' : 'Buscar',
            },
            {
              key: 'status',
              icon: 'options-outline',
              label: value.status ? 'Estado •' : 'Estado',
            },
            {
              key: 'date',
              icon: 'calendar-outline',
              label: value.date_from || value.date_to ? 'Fecha •' : 'Fecha',
            },
          ] as const
        ).map((item) => (
          <Pressable
            key={item.key}
            accessibilityRole="button"
            onPress={() => open(item.key)}
            style={styles.trigger}
          >
            <Ionicons
              name={item.icon}
              size={18}
              color={colors.accent}
              accessible={false}
            />
            <Text style={styles.text}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
      {value.search || value.status || value.date_from || value.date_to ? (
        <View style={styles.group}>
          <Text style={styles.muted}>
            {[
              value.search ? `“${value.search}”` : null,
              statuses.find((item) => item.value === value.status)?.label,
              value.date_from || value.date_to
                ? `${dateLabel}: ${value.date_from ?? 'Inicio'} → ${value.date_to ?? 'Sin límite'}`
                : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => onChange({})}
            style={styles.clear}
          >
            <Text style={styles.link}>Limpiar filtros</Text>
          </Pressable>
        </View>
      ) : null}
      <Modal
        visible={panel !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setPanel(null)}
      >
        <View style={styles.backdrop}>
          <SafeAreaView
            edges={['bottom', 'left', 'right']}
            style={styles.sheet}
          >
            <KeyboardAvoidingView
              style={styles.modalBody}
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
              <ScrollView
                keyboardShouldPersistTaps="always"
                contentContainerStyle={styles.content}
              >
                <Text style={styles.title}>
                  {panel === 'search'
                    ? 'Buscar por texto'
                    : panel === 'status'
                      ? 'Filtrar por estado'
                      : dateLabel}
                </Text>
                {panel === 'search' ? (
                  <>
                    <Text style={styles.muted}>{searchHint}</Text>
                    <TextInput
                      autoFocus
                      accessibilityLabel="Texto de búsqueda"
                      value={draft.search ?? ''}
                      onChangeText={(search) => setDraft({ ...draft, search })}
                      placeholder="Escribí al menos 3 caracteres"
                      placeholderTextColor={colors.muted}
                      maxLength={100}
                      returnKeyType="search"
                      onSubmitEditing={apply}
                      style={styles.input}
                    />
                  </>
                ) : null}
                {panel === 'status' ? (
                  <>
                    {choice(
                      'Todos los estados',
                      () => setDraft({ ...draft, status: undefined }),
                      !draft.status,
                    )}
                    {statuses.map((item) =>
                      choice(
                        item.label,
                        () => setDraft({ ...draft, status: item.value }),
                        draft.status === item.value,
                      ),
                    )}
                  </>
                ) : null}
                {panel === 'date' ? (
                  <>
                    <Text style={styles.muted}>
                      Hora de Argentina · Los rangos incluyen hoy
                    </Text>
                    <View style={styles.quick}>
                      {(
                        [
                          { key: 'today', label: 'Hoy' },
                          { key: 'tomorrow', label: 'Mañana' },
                          { key: 'seven_days', label: '7 días' },
                          { key: 'thirty_days', label: '30 días' },
                        ] as const
                      ).map((item) =>
                        choice(item.label, () =>
                          setDraft({ ...draft, ...quickDateRange(item.key) }),
                        ),
                      )}
                    </View>
                    <Text style={styles.muted}>
                      Elegí un día o un rango en el calendario.
                    </Text>
                    {choice(
                      `Desde: ${draft.date_from ?? 'Sin límite'}`,
                      () => setCalendarField('date_from'),
                      calendarField === 'date_from',
                    )}
                    {choice(
                      `Hasta: ${draft.date_to ?? 'Sin límite'}`,
                      () => setCalendarField('date_to'),
                      calendarField === 'date_to',
                    )}
                    <VisitCalendar
                      key={calendarField}
                      allowPast
                      value={draft[calendarField] ?? argentinaDay(new Date())}
                      disabled={false}
                      onChange={(day) => {
                        setDraft({
                          ...draft,
                          [calendarField]: day,
                          ...(calendarField === 'date_from'
                            ? { date_to: day }
                            : {}),
                        });
                        if (calendarField === 'date_from')
                          setCalendarField('date_to');
                      }}
                    />
                    {choice('Todas las fechas', () =>
                      setDraft({
                        ...draft,
                        date_from: undefined,
                        date_to: undefined,
                      }),
                    )}
                  </>
                ) : null}
                {error ? (
                  <Text accessibilityRole="alert" style={styles.error}>
                    {error}
                  </Text>
                ) : null}
                <Pressable
                  accessibilityRole="button"
                  onPress={apply}
                  style={styles.apply}
                >
                  <Text style={styles.applyText}>Aplicar filtros</Text>
                </Pressable>
                {choice('Atrás', () => setPanel(null))}
              </ScrollView>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

export function ListPagination({
  page,
  totalPages,
  onChange,
  disabled,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  disabled: boolean;
}) {
  if (totalPages <= 1) return null;
  return (
    <View style={styles.pagination}>
      <Pressable
        accessibilityRole="button"
        disabled={disabled || page <= 1}
        onPress={() => onChange(page - 1)}
        style={styles.choice}
      >
        <Text style={[styles.text, page <= 1 && styles.muted]}>Anterior</Text>
      </Pressable>
      <Text style={styles.muted}>
        {page} / {totalPages}
      </Text>
      <Pressable
        accessibilityRole="button"
        disabled={disabled || page >= totalPages}
        onPress={() => onChange(page + 1)}
        style={styles.choice}
      >
        <Text style={[styles.text, page >= totalPages && styles.muted]}>
          Siguiente
        </Text>
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  group: { gap: 8 },
  toolbar: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 12,
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  text: { color: colors.text, fontSize: 15 },
  muted: { color: colors.muted, lineHeight: 21 },
  link: { color: colors.accent, fontWeight: '700' },
  clear: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    height: '90%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: colors.surface,
  },
  modalBody: { flex: 1 },
  content: { padding: 20, gap: 12 },
  title: { color: colors.text, fontSize: 24, fontWeight: '800' },
  choice: {
    padding: 12,
    minHeight: 48,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
  },
  selected: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(39,180,126,0.12)',
  },
  input: {
    padding: 14,
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    color: colors.text,
    fontSize: 17,
  },
  quick: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  apply: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    borderRadius: 14,
  },
  applyText: { color: colors.text, fontSize: 16, fontWeight: '800' },
  error: { color: '#ff8d87' },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingVertical: 12,
  },
});
