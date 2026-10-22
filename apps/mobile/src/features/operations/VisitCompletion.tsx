import {
  useCompleteVisit,
  COMPLETE_VISIT_DESCRIPTION,
} from './CompleteVisitProvider';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  useConfirmCompletedOperation,
  useCreateTechnicianReview,
  useRejectCompletedOperation,
} from '@servicienta/query-hooks';
import type { Operation } from '@servicienta/types';
import { colors } from '@/theme/colors';

export function VisitCompletion({
  operation,
  user,
}: {
  operation: Operation;
  user: { id: string; role: string };
}) {
  const openCompleteVisit = useCompleteVisit();
  const confirm = useConfirmCompletedOperation();
  const reject = useRejectCompletedOperation();
  const review = useCreateTechnicianReview();
  const busy = useRef(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const pending = confirm.isPending || reject.isPending || review.isPending;
  const technician =
    user.role === 'technician' && user.id === operation.technician_id;
  const client = user.role === 'client' && user.id === operation.client_id;

  async function submit(action: 'confirm' | 'reject' | 'review') {
    if (busy.current) return;
    busy.current = true;
    setError('');
    try {
      if (action === 'confirm') await confirm.mutateAsync(operation.id);
      if (action === 'reject') await reject.mutateAsync(operation.id);
      if (action === 'review')
        await review.mutateAsync({
          operationId: operation.id,
          input: { rating, comment: comment.trim() || null },
        });
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'No se pudo guardar. Reintentá.',
      );
    } finally {
      busy.current = false;
    }
  }

  function button(
    label: string,
    onPress: () => void,
    secondary = false,
    disabled = false,
  ) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: pending || disabled, busy: pending }}
        disabled={pending || disabled}
        onPress={onPress}
        style={[
          styles.button,
          secondary && styles.secondary,
          (pending || disabled) && styles.disabled,
        ]}
      >
        <Text style={styles.buttonText}>{label}</Text>
      </Pressable>
    );
  }

  if (!technician && !client) return null;
  if (
    operation.status === 'pending' ||
    operation.status === 'cancelled' ||
    (client && operation.status === 'scheduled')
  )
    return null;
  return (
    <View style={styles.card}>
      {technician && operation.status === 'scheduled' ? (
        <>
          <Text style={styles.title}>Completar visita</Text>
          <Text style={styles.copy}>{COMPLETE_VISIT_DESCRIPTION}</Text>
          {button('Completar visita', () => openCompleteVisit(operation))}
        </>
      ) : null}
      {operation.status === 'completed_tech' ? (
        <>
          <Text style={styles.title}>
            {client
              ? 'El técnico completó la visita'
              : 'Esperando confirmación del cliente'}
          </Text>
          <Text style={styles.copy}>
            {client
              ? 'Confirmá si el trabajo está terminado. Después podrás dejar tu reseña.'
              : 'El cliente ya puede confirmar el trabajo y calificar la visita.'}
          </Text>
          {client ? (
            <>
              {button(
                'Confirmar visita completada',
                () => void submit('confirm'),
              )}
              {button(
                'El trabajo no está terminado',
                () => void submit('reject'),
                true,
              )}
            </>
          ) : null}
        </>
      ) : null}
      {operation.status === 'completion_rejected' ? (
        <Text style={styles.copy}>
          El cliente indicó que el trabajo no está terminado. Coordiná los
          próximos pasos por el chat del pedido.
        </Text>
      ) : null}
      {operation.technician_review ? (
        <>
          <Text style={styles.title}>Reseña de la visita</Text>
          <Text
            accessibilityLabel={`${operation.technician_review.rating} de 5 estrellas`}
            style={styles.stars}
          >
            {'★'.repeat(operation.technician_review.rating)}
            {'☆'.repeat(5 - operation.technician_review.rating)}
          </Text>
          {operation.technician_review.comment ? (
            <Text style={styles.copy}>
              {operation.technician_review.comment}
            </Text>
          ) : null}
        </>
      ) : client && operation.status === 'completed' ? (
        <>
          <Text style={styles.title}>¿Cómo fue la visita?</Text>
          <Text style={styles.copy}>
            Calificá al técnico de 1 a 5 estrellas.
          </Text>
          <View style={styles.rating}>
            {[1, 2, 3, 4, 5].map((value) => (
              <Pressable
                key={value}
                accessibilityRole="button"
                accessibilityLabel={`${value} de 5 estrellas`}
                accessibilityState={{
                  selected: rating === value,
                  disabled: pending,
                }}
                disabled={pending}
                onPress={() => setRating(value)}
                style={styles.star}
              >
                <Ionicons
                  name={value <= rating ? 'star' : 'star-outline'}
                  size={32}
                  color={colors.accent}
                />
              </Pressable>
            ))}
          </View>
          <TextInput
            accessibilityLabel="Comentario de la reseña (opcional)"
            placeholder="Contanos tu experiencia (opcional)"
            placeholderTextColor={colors.muted}
            value={comment}
            onChangeText={setComment}
            multiline
            editable={!pending}
            style={styles.input}
          />
          {button(
            'Enviar reseña',
            () => void submit('review'),
            false,
            rating === 0,
          )}
        </>
      ) : operation.status === 'completed' ? (
        <Text style={styles.copy}>
          El cliente confirmó la visita completada.
        </Text>
      ) : null}
      {pending ? (
        <ActivityIndicator
          color={colors.accent}
          accessibilityLabel="Guardando"
        />
      ) : null}
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    padding: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    backgroundColor: colors.surface,
  },
  title: { color: colors.text, fontSize: 20, fontWeight: '800' },
  copy: { color: colors.muted, lineHeight: 22 },
  button: {
    minHeight: 52,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.accent,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonText: { color: colors.text, fontWeight: '800', fontSize: 16 },
  disabled: { opacity: 0.5 },
  rating: { flexDirection: 'row', flexWrap: 'wrap' },
  star: {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stars: { color: colors.accent, fontSize: 28 },
  input: {
    minHeight: 100,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    color: colors.text,
    textAlignVertical: 'top',
  },
  error: { color: '#ff8d87', lineHeight: 22 },
});
