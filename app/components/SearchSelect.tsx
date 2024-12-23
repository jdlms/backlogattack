import { useMemo, useState } from "react";
import Fuse from "fuse.js";
import Select, { components } from "react-select";
// import { Option } from "~/routes/_index";

interface RawData {
  itemKey: string;
  currentS: number;
  imgUrl: string;
  base: number;
  title: string;
}

interface Option {
  value: string;
  label: string;
  imgUrl: string;
  currentS: number;
}

export default function SearchSelect({ data }: { data: RawData[] }) {
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState<Option[]>([]);

  // Prepare the data for React-Select
  const options = useMemo(
    () =>
      data.map((item) => ({
        value: item.itemKey,
        label: item.title,
        imgUrl: item.imgUrl,
        currentS: item.currentS,
      })),
    [data]
  );

  const fuse = useMemo(
    () =>
      new Fuse(options, {
        keys: ["label"], // Search by the title (label in options)
        threshold: 0.3,
      }),
    [options]
  );

  const handleInputChange = (inputValue: string) => {
    if (inputValue === "") {
      setFilteredOptions([]);
      setMenuIsOpen(false); // Don't open menu if there's no input
    } else {
      const results = fuse.search(inputValue).map((result) => result.item);
      setFilteredOptions(results);
      setMenuIsOpen(results.length > 0); // Open menu only if there are results
    }
  };

  const handleFocus = () => setMenuIsOpen(true);
  const handleBlur = () => setMenuIsOpen(false);

  const customStyles = {
    control: (provided: any) => ({
      ...provided,
      backgroundColor: "gray",
    }),
    menu: (provided: any) => ({
      ...provided,
      backgroundColor: "gray",
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isFocused ? "#d3d3d3" : "gray",
      color: "white",
    }),
  };

  const CustomDropdownIndicator = () => null;
  const CustomIndicatorSeparator = () => null;

  const CustomOption = (props: any) => {
    const { data } = props; // Access custom fields
    return (
      <components.Option {...props}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <img
            src={data.imgUrl}
            alt={data.label}
            style={{ width: "30px", height: "30px", marginRight: "10px" }}
          />
          <div>
            <strong>{data.label}</strong>
            <div style={{ fontSize: "12px", color: "gray" }}>
              Current Price: ${data.currentS}
            </div>
          </div>
        </div>
      </components.Option>
    );
  };

  return (
    <Select
      options={filteredOptions}
      onInputChange={handleInputChange}
      placeholder="Search..."
      styles={customStyles}
      menuIsOpen={menuIsOpen}
      onFocus={handleFocus}
      onBlur={handleBlur}
      components={{
        Option: CustomOption, // Use custom option
        DropdownIndicator: CustomDropdownIndicator,
        IndicatorSeparator: CustomIndicatorSeparator,
      }}
    />
  );
}
