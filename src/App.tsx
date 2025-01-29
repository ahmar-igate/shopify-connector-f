import { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./App.css";
import ApiVersion from "./components/combobox";

interface FormData {
  api_key: string;
  password: string;
  store_url: string;
  api_version: string;
  created_at_min: Date | null;
  created_at_max: Date | null;
}

function App() {
  const [formData, setFormData] = useState<FormData>({
    api_key: "",
    password: "",
    store_url: "",
    api_version: "2025-01", // Default value
    created_at_min: null,
    created_at_max: null,
  });

  const [fetching, setfetching] = useState<boolean>(false);
  const [syncing, setsyncing] = useState<boolean>(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleApiVersionChange = (version: string): void => {
    setFormData((prev) => ({ ...prev, api_version: version }));
  };

  const handleDateChange = (
    name: "created_at_min" | "created_at_max",
    date: Date | null
  ): void => {
    setFormData((prev) => {
      if (name === "created_at_min" && date) {
        // Ensure end date is not less than the start date
        if (prev.created_at_max && date > prev.created_at_max) {
          alert("Start date cannot be after the end date.");
          return prev;
        }
      } else if (name === "created_at_max" && date) {
        // Ensure start date is not greater than the end date
        if (prev.created_at_min && date < prev.created_at_min) {
          alert("End date cannot be before the start date.");
          return prev;
        }
      }
      return { ...prev, [name]: date };
    });
  };

  const handlefetching = async (): Promise<void> => {
    setfetching(true);
    try {
      const payload = {
        ...formData,
        created_at_min: formData.created_at_min?.toISOString() || null,
        created_at_max: formData.created_at_max?.toISOString() || null,
      };

      const response = await fetch("http://127.0.0.1:8000/api/fetch/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert("Data fetched successfully.");
        // const blob = await response.blob();
        // const url = window.URL.createObjectURL(blob);
        // const a = document.createElement("a");
        // a.href = url;
        // a.download = "orders_data.zip";
        // a.click();
        // window.URL.revokeObjectURL(url);
      } else {
        const errorData = await response.json();
        console.error("Error:", errorData);
        alert("Failed to fetch data. Check your credentials.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while detch data.");
    } finally {
      setfetching(false);
    }
  };


  const handlesyncing = async (): Promise<void> => {
    setsyncing(true);
    try {
      const payload = {
        ...formData,
        created_at_min: formData.created_at_min?.toISOString() || null,
        created_at_max: formData.created_at_max?.toISOString() || null,
      };

      const response = await fetch("http://127.0.0.1:8000/api/sync_data/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert("Data syncing successfully.");
      } else {
        const errorData = await response.json();
        console.error("Error:", errorData);
        alert("Failed to sync data. Check your credentials.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while syncing data.");
    } finally {
      setsyncing(false);
    }
  };

  return (
    <div className="container mx-auto sm:px-6 lg:px-8">
      <div className="divide-y divide-gray-200 rounded-lg bg-white shadow">
        <div className="px-4 py-5 sm:px-6">Shopify Credentials</div>

        <div className="flex">
          <div className="px-4 py-5 sm:p-6 flex-1">
            <div>
              <label
                htmlFor="api_key"
                className="block text-sm font-medium text-gray-900"
              >
                API Key
              </label>
              <div className="mt-2">
                <input
                  id="api_key"
                  name="api_key"
                  minLength={32}
                  maxLength={32}
                  type="password"
                  placeholder="Enter your API Key"
                  value={formData.api_key}
                  onChange={handleChange}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm"
                />
              </div>
            </div>
          </div>

          <div className="px-4 py-5 sm:p-6 flex-1">
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-900"
              >
                Password
              </label>
              <div className="mt-2">
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex">
          <div className="px-4 py-5 sm:p-6 flex-1">
            <div>
              <label
                htmlFor="store_url"
                className="block text-sm font-medium text-gray-900"
              >
                Store URL
              </label>
              <div className="mt-2">
                <input
                  id="store_url"
                  name="store_url"
                  type="text"
                  placeholder="Enter store URL"
                  value={formData.store_url}
                  onChange={handleChange}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm"
                />
              </div>
            </div>
          </div>

          <div className="px-4 py-5 sm:p-6 flex-1">
            <div>
              <ApiVersion onChange={handleApiVersionChange} />
            </div>
          </div>
        </div>

        <div className="flex">
          <div className="flex-1 flex">
          <div className="px-4 py-5 sm:p-6">
            <div>
              <label className="block text-sm font-medium text-gray-900">
                Created At Min (Start Date)
              </label>
              <div className="mt-2">
                <DatePicker
                  selected={formData.created_at_min}
                  onChange={(date) => handleDateChange("created_at_min", date)}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm"
                  placeholderText="Select start date"
                />
              </div>
            </div>
          </div>

          <div className="px-4 py-5 sm:p-6">
            <div>
              <label className="block text-sm font-medium text-gray-900">
                Created At Max (End Date)
              </label>
              <div className="mt-2">
                <DatePicker
                  selected={formData.created_at_max}
                  onChange={(date) => handleDateChange("created_at_max", date)}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm"
                  placeholderText="Select end date"
                />
              </div>
            </div>
          </div>
        </div>
          </div>
          

        <div className="px-4 py-4 flex gap-2 sm:px-6">
          <button
            type="button"
            onClick={handlefetching}
            disabled={fetching}
            className={`rounded-md px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
              fetching
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-500 focus-visible:outline-indigo-600"
            }`}
          >
            {fetching ? "Fetching..." : "Fetch Data"}
          </button>

          <button
            type="button"
            onClick={handlesyncing}
            value="sync_data"
            disabled={syncing}
            className={`rounded-md px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
              syncing
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-500 focus-visible:outline-red-600"
            }`}
          >
            {syncing ? "Syncing..." : "Sync Data"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
