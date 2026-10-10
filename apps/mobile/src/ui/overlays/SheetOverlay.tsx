import {
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetModalProps,
} from '@gorhom/bottom-sheet';
import { useEffect, useRef, type ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { components, palette, radii } from '@/core/theme/theme';

export interface SheetOverlayProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  snapPoints?: BottomSheetModalProps['snapPoints'];
}

/** Wrapper de Bottom Sheet (@gorhom) con handle clay y surface. */
export function SheetOverlay({ visible, onClose, children, snapPoints }: SheetOverlayProps) {
  const ref = useRef<BottomSheetModal>(null);

  useEffect(() => {
    if (visible) ref.current?.present();
    else ref.current?.dismiss();
  }, [visible]);

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

const styles = StyleSheet.create({
  bg: {
    backgroundColor: palette.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
  },
  handle: {
    width: components.sheetHandleWidth,
    height: components.sheetHandleHeight,
    backgroundColor: palette.border,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
});
