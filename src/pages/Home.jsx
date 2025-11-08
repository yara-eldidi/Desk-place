import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ref, onValue, set, remove } from "firebase/database";
import { db } from "../firebase";
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";

function HomePage() {
  const auth = getAuth();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlotType, setSelectedSlotType] = useState("full");
  const [bookings, setBookings] = useState([]);
  const [availableDesks, setAvailableDesks] = useState(100);
  const [allBookings, setAllBookings] = useState({});
  const [loadingLogout, setLoadingLogout] = useState(false);

  const desks = Array.from({ length: 100 }, (_, i) => `A${i + 1}`);

  // 🧩 متابعة حالة المستخدم
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) setUser(u);
      else navigate("/login");
    });
    return unsubscribe;
  }, [auth, navigate]);

  // 📅 استرجاع آخر تاريخ و slot محفوظين
  useEffect(() => {
    const savedDate = localStorage.getItem("selectedDate");
    const savedSlotType = localStorage.getItem("selectedSlotType");
    if (savedDate) setSelectedDate(new Date(savedDate));
    if (savedSlotType) setSelectedSlotType(savedSlotType);
  }, []);

  // 💾 حفظ التاريخ والـ slot
  useEffect(() => {
    if (selectedDate && selectedSlotType) {
      localStorage.setItem("selectedDate", selectedDate.toISOString());
      localStorage.setItem("selectedSlotType", selectedSlotType);
    }
  }, [selectedDate, selectedSlotType]);

  // 📊 تحميل الحجوزات لليوم الحالي
  useEffect(() => {
    if (!selectedDate) return;

    const localDate = new Date(
      selectedDate.getTime() - selectedDate.getTimezoneOffset() * 60000
    );
    const dateStr = localDate.toISOString().split("T")[0];
    const bookingsRef = ref(db, `bookings/${dateStr}`);

    const unsubscribe = onValue(bookingsRef, (snapshot) => {
      const data = snapshot.val() || {};
      setAllBookings(data);

      const available = desks.filter((desk) => {
        const deskBooking = data[desk];
        if (!deskBooking) return true;
        const typesBooked = Object.keys(deskBooking);

        if (selectedSlotType === "full") {
          return typesBooked.length === 0;
        } else {
          return (
            !typesBooked.includes("full") &&
            !typesBooked.includes(selectedSlotType)
          );
        }
      });
      setAvailableDesks(available.length);
    });

    return () => unsubscribe();
  }, [desks, selectedDate, selectedSlotType]);

  // 📋 تحميل جميع حجوزات المستخدم
  useEffect(() => {
    if (!user) return;

    const bookingsRef = ref(db, "bookings");
    const unsubscribe = onValue(bookingsRef, (snapshot) => {
      if (!user) return; // 🔒 تأمين إضافي
      const allData = snapshot.val() || {};
      const userBookings = [];

      Object.entries(allData).forEach(([date, desksData]) => {
        Object.entries(desksData).forEach(([desk, types]) => {
          Object.entries(types).forEach(([type, details]) => {
            if (details.email === user.email) {
              userBookings.push({
                date,
                deskNumber: desk,
                type,
                bookedAt: details.bookedAt,
              });
            }
          });
        });
      });

      userBookings.sort((a, b) => new Date(b.bookedAt) - new Date(a.bookedAt));
      setBookings(userBookings);
    });

    return () => unsubscribe();
  }, [user]);

  // 🖊️ إضافة حجز جديد
  const handleBooking = () => {
    if (!selectedDate) {
      alert("Please select a date before booking");
      return;
    }

    const localDate = new Date(
      selectedDate.getTime() - selectedDate.getTimezoneOffset() * 60000
    );
    const dateStr = localDate.toISOString().split("T")[0];

    const available = desks.filter((desk) => {
      const deskBooking = allBookings[desk];
      if (!deskBooking) return true;

      const typesBooked = Object.keys(deskBooking);
      if (selectedSlotType === "full") {
        return typesBooked.length === 0;
      } else {
        return (
          !typesBooked.includes("full") &&
          !typesBooked.includes(selectedSlotType)
        );
      }
    });

    if (available.length === 0) {
      alert("No desks available for this slot.");
      return;
    }

    const chosenDesk = available[0];
    const bookingRef = ref(
      db,
      `bookings/${dateStr}/${chosenDesk}/${selectedSlotType}`
    );

    set(bookingRef, {
      email: user.email,
      bookedAt: new Date().toISOString(),
    });
  };

  // ❌ إلغاء الحجز
  const handleCancel = (b) => {
    const bookingRef = ref(db, `bookings/${b.date}/${b.deskNumber}/${b.type}`);
    remove(bookingRef);
  };

  // 🚪 تسجيل الخروج (محسّن)
  const handleLogout = async () => {
    try {
      setLoadingLogout(true);
      await signOut(auth);
      setUser(null);
      localStorage.removeItem("selectedDate");
      localStorage.removeItem("selectedSlotType");
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setLoadingLogout(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="head flex items-center justify-between mb-8 p-4 bg-cyan-700 rounded-b-lg shadow-md">
        <div>
          <h1 className="text-2xl font-bold text-white">Desk Place</h1>
          <p className="text-cyan-50">
            Welcome back,{" "}
            <span className="text-amber-100 font-semibold">
              {user?.email
                ? user.email.split("@")[0].charAt(0).toUpperCase() +
                  user.email.split("@")[0].slice(1)
                : ""}
            </span>
          </p>
        </div>
        <button
          onClick={handleLogout}
          disabled={loadingLogout}
          className={`font-bold px-4 py-2 rounded-md transition-all duration-500 
            ${
              loadingLogout
                ? "bg-gray-400 text-white cursor-not-allowed"
                : "bg-gray-50 text-cyan-700 hover:bg-gray-200"
            }`}
        >
          {loadingLogout ? "Logging out..." : "Logout"}
        </button>
      </div>

      <div className="max-w-6xl mx-auto pb-10">
        <div className="grid md:grid-cols-2 gap-6">
          {/* 🗓️ الحجز */}
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow duration-500">
            <h2 className="text-lg font-bold text-gray-800 mb-1">
              Book a Desk
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Select your preferred date and slot
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Select Date
              </label>
              <DatePicker
                selected={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                minDate={new Date()}
                inline
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Select Slot Type
              </label>
              <select
                value={selectedSlotType}
                onChange={(e) => setSelectedSlotType(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 mt-1"
              >
                <option value="full">Full Day</option>
                <option value="morning">Morning Half Day</option>
                <option value="afternoon">Afternoon Half Day</option>
              </select>
            </div>

            <div className="flex justify-between items-center bg-blue-50 p-3 rounded-md mb-4">
              <span className="text-gray-700">Available Desks</span>
              <span className="bg-white px-3 py-1 rounded-md shadow text-cyan-600 font-bold">
                {availableDesks}
              </span>
            </div>

            <div className="grid grid-cols-10 gap-2 mb-4">
              {desks.map((desk) => {
                const deskBooking = allBookings[desk];
                const typesBooked = deskBooking ? Object.keys(deskBooking) : [];
                const isMine = typesBooked.some(
                  (t) => deskBooking[t].email === user?.email
                );
                const booked =
                  typesBooked.includes("full") ||
                  typesBooked.includes(selectedSlotType);

                return (
                  <div
                    key={desk}
                    className={`p-2 rounded text-center cursor-pointer text-sm font-semibold flex items-center justify-center
                    ${
                      isMine
                        ? "bg-cyan-500 text-white"
                        : booked
                        ? "bg-red-400 text-white"
                        : "bg-emerald-600 text-white"
                    }`}
                  >
                    {desk}
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleBooking}
              className="w-full bg-black text-white py-2 rounded-md hover:bg-gray-800 transition-all duration-500"
            >
              Book Desk
            </button>
          </div>

          {/* 📋 الحجوزات */}
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow duration-500">
            <h2 className="text-lg font-bold text-gray-800 mb-1">
              Your Bookings
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              All your current desk reservations
            </p>

            {bookings.length > 0 ? (
              <div className="space-y-4 max-h-[700px] overflow-y-auto">
                {bookings.map((b, index) => (
                  <div
                    key={index}
                    className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2"
                  >
                    <p className="text-gray-800">
                      <strong>Date:</strong> {b.date}
                    </p>
                    <p className="text-gray-800">
                      <strong>Slot:</strong> {b.type}
                    </p>
                    <p className="text-gray-800">
                      <strong>Desk:</strong> {b.deskNumber}
                    </p>
                    <button
                      onClick={() => handleCancel(b)}
                      className="mt-3 w-full bg-red-500 text-white py-2 rounded-md hover:bg-red-600 transition-all duration-700"
                    >
                      Cancel Booking
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 mt-10">
                <p>No active bookings</p>
                <p>Select a date and slot to book a desk</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
