import wave
import struct
import math

sample_rate = 44100
duration = 40

with wave.open('ambient.wav', 'w') as wav_file:
    wav_file.setnchannels(1)
    wav_file.setsampwidth(2)
    wav_file.setframerate(sample_rate)
    
    # Write frames
    for i in range(sample_rate * duration):
        t = float(i) / sample_rate
        # Low frequency drone 150 Hz
        value = int(32767.0 * 0.05 * math.sin(2.0 * math.pi * 150.0 * t))
        data = struct.pack('<h', value)
        wav_file.writeframesraw(data)

