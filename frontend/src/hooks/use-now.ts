import { useState } from 'react';

/** A timestamp fixed when the component mounts, so derived values stay stable across re-renders. */
export const useNow = () => useState(() => Date.now())[0];
