import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./App.css";
import ApiVersion from "./components/combobox";
import { XCircleIcon, ArrowPathIcon } from "@heroicons/react/20/solid";
import Notification from "./components/Notification";

interface FormData {
  api_key: string;
  password: string;
  store_url: string;
  api_version: string;
  created_at_min: Date | null;
  created_at_max: Date | null;
  fetchsync: boolean;
}

interface StoreOrderDate {
  store_name: string;
  created_at_min_shopify: string;
  created_at_max_shopify: string;
  updated_at: string;
}

interface FormattedActivity {
  id: number;
  store_name: string;
  date: string;
  last_sync: string;
  // updated_at: string;
}

const VALID_STORE_URLS = [
  "rdx-sports-store.myshopify.com",
  "rdx-sports-store-europe.myshopify.com",
  "rdx-sports-store-usa.myshopify.com",
  "rdx-sports-store-canada.myshopify.com",
  "rdx-sports-middle-east.myshopify.com",
  "rdx-sports-store-global.myshopify.com",
];

function App() {
  const [formData, setFormData] = useState<FormData>({
    api_key: "",
    password: "",
    store_url: "",
    api_version: "2025-01",
    created_at_min: null,
    created_at_max: null,
    fetchsync: false,
  });

  const [fetching, setFetching] = useState<boolean>(false);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [refresh, setRefresh] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
  }>({
    show: false,
    message: "",
  });
  const [activities, setActivities] = useState<FormattedActivity[]>([]);

  const validateForm = (isFetching: boolean): boolean => {
    const newErrors: string[] = [];
    const {
      api_key,
      password,
      store_url,
      created_at_min,
      created_at_max,
      fetchsync,
    } = formData;

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

    // Check start and end date only if fetchsync is NOT checked
    if (isFetching && !fetchsync) {
      if (!created_at_min || !created_at_max) {
        newErrors.push(
          "Both Start Date and End Date are required for Fetch Data."
        );
      }
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, type, checked, value } = e.target;

    setFormData((prev) => {
      const updatedForm = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };

      // If fetchsync is checked, clear the date fields
      if (name === "fetchsync" && checked) {
        updatedForm.created_at_min = null;
        updatedForm.created_at_max = null;
      }

      return updatedForm;
    });
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

  const handleDefault = async (): Promise<void> => {
    try {
      setRefresh(true);
      const response = await fetch("http://127.0.0.1:8000/", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data: {
        store_order_dates: StoreOrderDate[];
        last_sync_min: string;
        last_sync_max: string;
      } = await response.json();

      if (data.store_order_dates && data.store_order_dates.length > 0) {
        const formattedData: FormattedActivity[] = data.store_order_dates.map(
          (store: StoreOrderDate, index: number) => ({
            id: index + 1,
            store_name: store.store_name,
            date: `${new Date(
              store.created_at_min_shopify
            ).toLocaleString()} - ${new Date(
              store.created_at_max_shopify
            ).toLocaleString()}`,
            last_sync: `${new Date(
              data.last_sync_min
            ).toLocaleString()} - ${new Date(
              data.last_sync_max
            ).toLocaleString()} on ${new Date(
              store.updated_at
            ).toLocaleString()}`,
            // updated_at: new Date(store.updated_at).toLocaleString(),
          })
        );

        setActivities(formattedData);
      } else {
        console.warn("No store order dates found.");
      }
      setLastRefreshed(new Date().toLocaleString());
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setRefresh(false);
    }
  };

  useEffect(() => {
    handleDefault();
  }, []);

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
        <div className="rounded-lg bg-white shadow">
          <div className="px-4 py-5 sm:px-6 font-medium border-b border-b-gray-200 flex justify-between items-center">
            <span>
              Recent Activity <br />
              {lastRefreshed && (
                <p className="text-xs text-gray-600 mt-1">
                  Last refreshed on: {lastRefreshed}
                </p>
              )}
            </span>
            <span>
              <button
                type="button"
                onClick={handleDefault}
                disabled={refresh}
                className={`text-xs bg-slate-200 px-2.5 py-1 rounded hover:bg-slate-100 focus-visible:outline-slate-400 transition-all 
                  ${refresh ? "cursor-not-allowed" : "cursor-pointer"}`}
              >
                <div className="flex items-center gap-1">
                  <div className="shrink-0">
                    <ArrowPathIcon
                      aria-hidden="true"
                      className="size-4 text-black"
                    />
                  </div>
                  <div>{refresh ? "Refreshing..." : "Refresh"}</div>
                </div>
              </button>
            </span>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="overflow-x-auto max-w-full">
              {" "}
              {/* Add scrolling wrapper */}
              <table className="w-full min-w-max divide-y divide-gray-300">
                {" "}
                {/* proper width */}
                <thead>
                  <tr>
                    <th
                      scope="col"
                      className="py-3.5 pr-3 pl-4 text-left text-sm font-semibold whitespace-nowrap text-gray-900 sm:pl-0"
                    >
                      #
                    </th>
                    <th
                      scope="col"
                      className="py-3.5 pr-3 pl-4 text-left text-sm font-semibold whitespace-nowrap text-gray-900 sm:pl-0"
                    >
                      Store
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-3.5 text-left text-sm font-semibold whitespace-nowrap text-gray-900"
                    >
                      Fetched Orders
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-3.5 text-left text-sm font-semibold whitespace-nowrap text-gray-900"
                    >
                      Last Synced Data
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {activities.map((activity) => (
                    <tr key={activity.id}>
                      <td className="py-2 px-4 text-sm whitespace-nowrap text-gray-500">
                        {activity.id}
                      </td>
                      <td className="py-2 px-4 text-sm whitespace-nowrap text-gray-500">
                        {activity.store_name}
                      </td>
                      <td className="px-2 py-2 text-sm whitespace-nowrap text-gray-900">
                        {activity.date}
                      </td>
                      <td className="px-2 py-2 text-sm whitespace-nowrap text-gray-900">
                        {activity.last_sync}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

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
          <div className="px-4 py-5 sm:px-6 font-medium">
            Shopify Connection
          </div>

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
                      className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:outline-indigo-600 sm:text-sm"
                      placeholderText="Select start date"
                      disabled={formData.fetchsync} // Disable when fetchsync is checked
                    />
                  </div>
                </div>
                <small className="text-gray-500">
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
                      className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:outline-indigo-600 sm:text-sm"
                      placeholderText="Select end date"
                      disabled={formData.fetchsync} // Disable when fetchsync is checked
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="fullfetch_box">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex gap-3">
                <div className="flex h-6 shrink-0 items-center">
                  <div className="group grid size-4 grid-cols-1">
                    <input
                      id="fetchsync"
                      name="fetchsync"
                      type="checkbox"
                      value={formData.fetchsync.toString()}
                      onChange={handleChange}
                      aria-describedby="fetchsync-description"
                      className="col-start-1 row-start-1 appearance-none rounded-sm border border-gray-300 bg-white checked:border-slate-600 checked:bg-slate-600 indeterminate:border-slate-600 indeterminate:bg-slate-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:checked:bg-gray-100 forced-colors:appearance-auto"
                    />
                    <svg
                      fill="none"
                      viewBox="0 0 14 14"
                      className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-disabled:stroke-gray-950/25"
                    >
                      <path
                        d="M3 8L6 11L11 3.5"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="opacity-0 group-has-checked:opacity-100"
                      />
                      <path
                        d="M3 7H11"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="opacity-0 group-has-indeterminate:opacity-100"
                      />
                    </svg>
                  </div>
                </div>
                <div className="text-sm/6">
                  <label
                    htmlFor="fetchsync"
                    className="font-medium text-gray-900"
                  >
                    Full Fetch & Sync
                  </label>{" "}
                  <span id="fetchsync-description" className="text-gray-500">
                    <span className="sr-only">fetchsync </span>select to fetch
                    or sync full data from shopify.
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 py-4 flex justify-between sm:px-6">
            <div className="buttons flex gap-2">
              <button
                type="button"
                onClick={handleFetching}
                disabled={fetching || syncing}
                className={`rounded-md px-4 py-1.5 text-xs font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                  fetching || syncing
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
                disabled={syncing || fetching}
                className={`rounded-md px-4 py-1.5 text-xs font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                  syncing || fetching
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
    </div>
  );
}

export default App;
