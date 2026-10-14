import {
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetModalProps,
} from '@gorhom/bottom-sheet';
import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { components, radii } from '@/core/theme/theme';
import { useAppTheme } from '@/core/theme/ThemeProvider';

export interface SheetOverlayProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  snapPoints?: BottomSheetModalProps['snapPoints'];
}

/** Wrapper de Bottom Sheet (@gorhom) con handle clay y surface. */
export function SheetOverlay({ visible, onClose, children, snapPoints }: SheetOverlayProps) {
  const { colors } = useAppTheme();
  const ref = useRef<BottomSheetModal>(null);

  useEffect(() => {
    if (visible) ref.current?.present();
    else ref.current?.dismiss();
  }, [visible]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        bg: {
          backgroundColor: colors.surface,
          borderTopLeftRadius: radii.lg,
          borderTopRightRadius: radii.lg,
        },
        handle: {
          width: components.sheetHandleWidth,
          height: components.sheetHandleHeight,
          backgroundColor: colors.border,
        },
        content: {
          flex: 1,
          paddingHorizontal: 20,
        },
      }),
    [colors],
  );

  return (
    <BottomSheetModal
      ref={ref}
      onDismiss={onClose}
      snapPoints={snapPoints ?? ['65%']}
      handleIndicatorStyle={styles.handle}
      backgroundStyle={styles.bg}
    >
      <BottomSheetView style={styles.content}>{children}</BottomSheetView>
    </BottomSheetModal>
  );
}
