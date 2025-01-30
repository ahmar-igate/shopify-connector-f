import { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./App.css";
import ApiVersion from "./components/combobox";
import { XCircleIcon } from "@heroicons/react/20/solid";
import Notification from "./components/Notification";

interface FormData {
  api_key: string;
  password: string;
  store_url: string;
  api_version: string;
  created_at_min: Date | null;
  created_at_max: Date | null;
}

const VALID_STORE_URLS = [
  "rdx-sports-store.myshopify.com",
  "rdx-sports-store-europe.myshopify.com",
  "rdx-sports-store-usa.myshopify.com",
  "rdx-sports-store-canada.myshopify.com",
  "rdx-sports-middle-east.myshopify.com",
];

function App() {
  const [formData, setFormData] = useState<FormData>({
    api_key: "",
    password: "",
    store_url: "",
    api_version: "2025-01",
    created_at_min: null,
    created_at_max: null,
  });

  const [fetching, setFetching] = useState<boolean>(false);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [notification, setNotification] = useState<{ show: boolean; message: string }>({
    show: false,
    message: "",
  });

  const validateForm = (isFetching: boolean): boolean => {
    const newErrors: string[] = [];
    const { api_key, password, store_url, created_at_min, created_at_max } =
      formData;

    if (!api_key || !password || !store_url) {
      newErrors.push("API Key, Password, and Store URL are required fields.");
    }

    if (api_key.length < 32) {
      newErrors.push(
        "API Key must be alphanumeric and at least 32 characters long."
      );
    }

    if (password.length < 32) {
      newErrors.push(
        "Password must be alphanumeric and at least 32 characters long."
      );
    }

    if (!VALID_STORE_URLS.includes(store_url)) {
      newErrors.push(
        "Invalid Store URL. Please select a valid Shopify store URL."
      );
    }

    if (
      isFetching &&
      (!created_at_min || !created_at_max) &&
      (created_at_min === null || created_at_max === null)
    ) {
      newErrors.push(
        "Both Start Date and End Date are required for Fetch Data."
      );
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

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
        if (prev.created_at_max && date > prev.created_at_max) {
          setErrors(["Start date cannot be after the end date."]);
          return prev;
        }
      } else if (name === "created_at_max" && date) {
        if (prev.created_at_min && date < prev.created_at_min) {
          setErrors(["End date cannot be before the start date."]);
          return prev;
        }
      }
      return { ...prev, [name]: date };
    });
  };

  const handleFetching = async (): Promise<void> => {
    if (!validateForm(true)) return;

    setFetching(true);
    try {
      const payload = {
        ...formData,
        created_at_min: formData.created_at_min?.toISOString() || null,
        created_at_max: formData.created_at_max?.toISOString() || null,
      };

      const response = await fetch("http://127.0.0.1:8000/api/save/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();
      if (response.ok) {
        setErrors([]); // Clear errors on success
        setNotification({ show: true, message: "Data fetched successfully!" });

      } else {
        setErrors([responseData.message || "Failed to save data."]);
      }
    } catch (error) {
      setErrors(["An error occurred while fetching data."]);
    } finally {
      setFetching(false);
    }
  };

  const handleSyncing = async (): Promise<void> => {
    if (!validateForm(false)) return;

    setSyncing(true);
    try {
      const payload = {
        ...formData,
        created_at_min: formData.created_at_min?.toISOString() || null,
        created_at_max: formData.created_at_max?.toISOString() || null,
      };

      const response = await fetch("http://127.0.0.1:8000/api/sync/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();
      if (response.ok) {
        setErrors([]);
        setNotification({ show: true, message: "Data synced successfully!" });
      } else {
        setErrors([responseData.message || "Failed to save data."]);
        // const errorData = await response.json();
        // setErrors(["Failed to sync data. Check your credentials."]);
      }
    } catch (error) {
      setErrors(["An error occurred while syncing data."]);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="container max-w-3xl sm:px-6 lg:px-8">
        {notification.show && <Notification message={notification.message} />}
        {errors.length > 0 && (
          <div className="relative rounded-md bg-red-50 p-4 mb-4">
            <div className="flex">
              <div className="shrink-0">
                <XCircleIcon
                  aria-hidden="true"
                  className="size-5 text-red-400"
                />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  There {errors.length === 1 ? "was" : "were"} {errors.length}{" "}
                  error{errors.length > 1 ? "s" : ""} with your submission
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <ul role="list" className="list-disc space-y-1 pl-5">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="absolute top-2 right-4">
                <button
                  onClick={() => setErrors([])}
                  className="rounded-md text-red-400 hover:text-red-600 focus:outline-none"
                >
                  <span className="sr-only">Dismiss</span>✕
                </button>
              </div>
            </div>
          </div>
        )}
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
                    Start Date
                  </label>
                  <div className="mt-2">
                    <DatePicker
                      selected={formData.created_at_min}
                      onChange={(date) =>
                        handleDateChange("created_at_min", date)
                      }
                      className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm"
                      placeholderText="Select start date"
                    />
                  </div>
                </div>
                <small className="text-red-800">
                  Start and End dates are not required for sync operations
                </small>
              </div>

              <div className="px-4 py-5 sm:p-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900">
                    End Date
                  </label>
                  <div className="mt-2">
                    <DatePicker
                      selected={formData.created_at_max}
                      onChange={(date) =>
                        handleDateChange("created_at_max", date)
                      }
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
              onClick={handleFetching}
              disabled={fetching}
              className={`rounded-md px-4 py-1.5 text-xs font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                fetching
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-500 focus-visible:outline-indigo-600"
              }`}
            >
              {fetching ? "Fetching..." : "Fetch Data"}
            </button>

            <button
              type="button"
              onClick={handleSyncing}
              value="sync_data"
              disabled={syncing}
              className={`rounded-md px-4 py-1.5 text-xs font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
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
    </div>
  );
}

export default App;
