import { useMemo, useState } from "react";
import Fuse from "fuse.js";
import Select from "react-select";
import { Option } from "~/routes/_index";

export default function SearchSelect({ data }: any) {
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState<Option[]>(data);

  const fuse = useMemo(
    () =>
      new Fuse(data, {
        keys: ["label"],
        threshold: 0.3,
      }),
    [data]
  );

  const handleInputChange = (inputValue: string) => {
    if (inputValue === "") {
      setFilteredOptions(data);
      setMenuIsOpen(false);
    } else {
      const results = fuse.search(inputValue).map((result) => result.item);
      setFilteredOptions(results as Option[]);
      setMenuIsOpen(true);
    }
  };

  const handleFocus = () => {
    setMenuIsOpen(true); // Re-open menu when input is focused
  };

  const handleBlur = () => {
    setMenuIsOpen(false); // Close menu when input loses focus
  };

  const customStyles = {
    control: (provided: any) => ({
      ...provided,
      backgroundColor: "gray", // Background of the control
    }),
    menu: (provided: any) => ({
      ...provided,
      backgroundColor: "gray", // Background of the dropdown menu
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isFocused ? "#d3d3d3" : "gray", // Highlight focused option
      color: "white", // Text color
    }),
  };

  const CustomDropdownIndicator = () => null;
  const CustomIndicatorSeparator = () => null;

  return (
    <Select
      options={filteredOptions}
      onInputChange={handleInputChange}
      placeholder="Search..."
      styles={customStyles}
      openMenuOnClick={false}
      onFocus={handleFocus} // Handle focus event
      onBlur={handleBlur} // Handle blur event
      menuIsOpen={menuIsOpen}
      components={{
        DropdownIndicator: CustomDropdownIndicator,
        IndicatorSeparator: CustomIndicatorSeparator,
      }}
    />
  );
}
