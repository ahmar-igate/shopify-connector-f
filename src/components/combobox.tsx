'use client';

import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Label,
} from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { useState } from 'react';

// Define the type for a person
type Person = {
  id: number;
  name: string;
};

// Props for the ApiVersion component
interface ApiVersionProps {
  onChange: (version: string) => void;
}

const people: Person[] = [
  { id: 1, name: '2025-01' },
  { id: 2, name: '2024-10' },
  { id: 3, name: '2024-07' },
  { id: 4, name: '2024-04' },
];

export default function ApiVersion({ onChange }: ApiVersionProps) {
  const [query, setQuery] = useState<string>('');
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(people[0]); // Default to the first person

  const filteredPeople = query === ''
    ? people
    : people.filter((person) =>
        person.name.toLowerCase().includes(query.toLowerCase())
      );

  // Handle selection change
  const handleSelectionChange = (person: Person) => {
    setQuery('');
    setSelectedPerson(person);
    onChange(person.name); // Notify parent component of the change
  };

  return (
    <Combobox
      as="div"
      value={selectedPerson}
      onChange={handleSelectionChange}
    >
      <Label className="block text-sm font-medium text-gray-900">
        API Version
      </Label>
      <div className="relative mt-2">
        <ComboboxInput
          className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm"
          onChange={(event) => setQuery(event.target.value)}
          onBlur={() => setQuery('')}
          displayValue={(person: Person | null) => person?.name || ''}
        />
        <ComboboxButton className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none">
          <ChevronUpDownIcon className="w-5 h-5 text-gray-400" aria-hidden="true" />
        </ComboboxButton>

        {filteredPeople.length > 0 && (
          <ComboboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
            {filteredPeople.map((person) => (
              <ComboboxOption
                key={person.id}
                value={person}
                className="group relative cursor-default select-none py-2 pl-3 pr-9 text-gray-900 data-[focus]:bg-indigo-600 data-[focus]:text-white data-[focus]:outline-none"
              >
                <span className="block truncate group-data-[selected]:font-semibold">
                  {person.name}
                </span>

                <span className="absolute inset-y-0 right-0 hidden items-center pr-4 text-indigo-600 group-data-[selected]:flex group-data-[focus]:text-white">
                  <CheckIcon className="w-5 h-5" aria-hidden="true" />
                </span>
              </ComboboxOption>
            ))}
          </ComboboxOptions>
        )}
      </div>
    </Combobox>
  );
}
