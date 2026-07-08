import { useEffect, useState } from 'react';
import { Animated, Dimensions, Easing, Keyboard, Platform, type KeyboardEvent, type KeyboardEventName } from 'react-native';

function insetFromKeyboard(event?: KeyboardEvent): number {
  const metrics = event?.endCoordinates ?? Keyboard.metrics();
  if (!metrics) return 0;

  const windowHeight = Dimensions.get('window').height;
  const inset = windowHeight - metrics.screenY;
  return Math.max(0, inset || metrics.height);
}

/**
 * Tracks the visible soft keyboard height as a bottom inset for floating UI.
 * The value is 0 while the keyboard is closed.
 */
export function useKeyboardBottomInset(): number {
  const [bottomInset, setBottomInset] = useState(() => insetFromKeyboard());

  useEffect(() => {
    const show = (event: KeyboardEvent) => {
      if (Platform.OS === 'ios') Keyboard.scheduleLayoutAnimation(event);
      setBottomInset(insetFromKeyboard(event));
    };
    const hide = (event: KeyboardEvent) => {
      if (Platform.OS === 'ios') Keyboard.scheduleLayoutAnimation(event);
      setBottomInset(0);
    };

    const listeners: { name: KeyboardEventName; handler: (event: KeyboardEvent) => void }[] =
      Platform.OS === 'ios'
        ? [
            { name: 'keyboardWillShow', handler: show },
            { name: 'keyboardWillChangeFrame', handler: show },
            { name: 'keyboardWillHide', handler: hide },
          ]
        : [
            { name: 'keyboardDidShow', handler: show },
            { name: 'keyboardDidHide', handler: hide },
          ];

    const subscriptions = listeners.map(({ name, handler }) => Keyboard.addListener(name, handler));
    return () => subscriptions.forEach((subscription) => subscription.remove());
  }, []);

  return bottomInset;
}

/**
 * Animated version for surfaces that should track the iOS keyboard without
 * snapping through a layout jump.
 */
export function useAnimatedKeyboardBottomInset(): Animated.Value {
  const [bottomInset] = useState(() => new Animated.Value(insetFromKeyboard()));

  useEffect(() => {
    const animateTo = (event: KeyboardEvent | undefined, toValue: number) => {
      Animated.timing(bottomInset, {
        toValue,
        duration: event?.duration ?? 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    };
    const show = (event: KeyboardEvent) => animateTo(event, insetFromKeyboard(event));
    const hide = (event: KeyboardEvent) => animateTo(event, 0);

    const listeners: { name: KeyboardEventName; handler: (event: KeyboardEvent) => void }[] =
      Platform.OS === 'ios'
        ? [
            { name: 'keyboardWillShow', handler: show },
            { name: 'keyboardWillChangeFrame', handler: show },
            { name: 'keyboardWillHide', handler: hide },
          ]
        : [
            { name: 'keyboardDidShow', handler: show },
            { name: 'keyboardDidHide', handler: hide },
          ];

    const subscriptions = listeners.map(({ name, handler }) => Keyboard.addListener(name, handler));
    return () => subscriptions.forEach((subscription) => subscription.remove());
  }, [bottomInset]);

  return bottomInset;
}
