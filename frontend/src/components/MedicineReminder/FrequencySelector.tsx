import { Button } from '../ui/button';
import type { Frequency } from '../../types/Medicine';

interface FrequencySelectorProps {
    selectedFrequency: Frequency;
    onChange: (frequency: Frequency) => void;
}

const frequencies: { value: Frequency; label: string; description: string }[] = [
    { value: 'daily', label: 'Daily', description: 'Every day' },
    { value: 'weekly', label: 'Weekly', description: 'Specific days each week' },
    { value: 'custom', label: 'Custom', description: 'Pick exact days' },
];

export function FrequencySelector({ selectedFrequency, onChange }: FrequencySelectorProps) {
    return (
        <div className="flex gap-2">
            {frequencies.map((freq) => (
                <Button
                    key={freq.value}
                    type="button"
                    variant={selectedFrequency === freq.value ? 'default' : 'outline'}
                    className={`flex-1 text-xs py-2 transition-all duration-200 ${selectedFrequency === freq.value
                            ? 'bg-blue-500 hover:bg-blue-600 shadow-md scale-[1.02]'
                            : 'hover:border-blue-300 hover:text-blue-600'
                        }`}
                    onClick={() => onChange(freq.value)}
                    title={freq.description}
                >
                    {freq.label}
                </Button>
            ))}
        </div>
    );
}
