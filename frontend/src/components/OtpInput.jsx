import { useRef } from 'react';

export default function OtpInput({ value, onChange }) {
  const inputs = useRef([]);
  const digits = value.split('');

  const handleChange = (index, e) => {
    const val = e.target.value.replace(/\D/g, '');
    if (!val) return;

    const newDigits = [...digits];
    newDigits[index] = val[val.length - 1];

    // Pad to 6 digits
    while (newDigits.length < 6) newDigits.push('');
    onChange(newDigits.join(''));

    // Advance to next input
    if (index < 5) inputs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      const newDigits = [...digits];
      newDigits[index] = '';
      while (newDigits.length < 6) newDigits.push('');
      onChange(newDigits.join(''));
      if (index > 0) inputs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, 6);
    onChange(pasted.padEnd(6, ''));
    inputs.current[Math.min(pasted.length, 5)]?.focus();
  };

  return (
    <div className='flex gap-3 justify-center'>
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => (inputs.current[i] = el)}
          type='text'
          inputMode='numeric'
          maxLength={1}
          value={digits[i] || ''}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className='w-11 h-12 text-center text-lg font-semibold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6366f1] focus:border-transparent'
        />
      ))}
    </div>
  );
}
