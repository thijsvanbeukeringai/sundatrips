import { FlatList, Pressable, StyleSheet, Text } from 'react-native'

import { formatShort, nextDays } from '@/lib/dates'
import { colors, theme } from '@/theme/colors'

interface Props {
  value: string | null
  onChange: (iso: string) => void
  /** First selectable date (ISO). Earlier dates are hidden. */
  minDate?: string
  /** How many days to offer. */
  days?: number
}

// Horizontal strip of selectable dates — no native date-picker dependency.
export function DatePicker({ value, onChange, minDate, days = 60 }: Props) {
  let options = nextDays(days)
  if (minDate) options = options.filter((d) => d >= minDate)

  return (
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      data={options}
      keyExtractor={(d) => d}
      contentContainerStyle={styles.row}
      renderItem={({ item }) => {
        const active = item === value
        return (
          <Pressable
            style={[styles.cell, active && styles.cellActive]}
            onPress={() => onChange(item)}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{formatShort(item)}</Text>
          </Pressable>
        )
      }}
    />
  )
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingVertical: 4 },
  cell: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.gray[100],
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cellActive: { backgroundColor: colors.jungle[50], borderColor: theme.primary },
  label: { fontSize: 13, fontWeight: '600', color: theme.text },
  labelActive: { color: theme.primary },
})
