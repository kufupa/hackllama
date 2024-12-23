/* eslint-disable react/display-name */
"use client";

import RealtimeSvg from "./svgs/realtime.svg";
import QuerySVG from "./svgs/query.svg";
import NotesSVG from "./svgs/notifications.svg";
import LogoutSVG from "./svgs/logout.svg";
import React, {
    createContext,
    memo,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from "react";
import {floodfill} from "@/lib/floodfill";
import {patients} from "@/lib/mockData";
import Image from "next/image";
import {Patient} from "@/lib/types";
import {TrendingUp, X} from "lucide-react";
import {CartesianGrid, Dot, Line, LineChart, XAxis, BarChart, YAxis, Tooltip, Bar, ResponsiveContainer} from "recharts";
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import Radial from "./radial";
import Cube from "./three";
import Modal from './Modal'; // Import Modal component
import { Plus } from "lucide-react";

import MealsSummary from "./MealsSummary";
import ChatInput from "./ChatInput";

const images = ['/P1.jpg', '/P2.jpg', '/P3.jpg'];

var sampleMeals = [
  {
    date: "2024-11-17",
    time: "08:30",
    summary: "Scrambled eggs with toast",
    calories: 350,
    health_score: 85,
    user_input: "Healthy breakfast",
  },
  {
    date: "2024-11-17",
    time: "13:00",
    summary: "Grilled chicken salad",
    calories: 400,
    health_score: 90,
    user_input: "Low-carb lunch",
  },
  {
    date: "2024-11-17",
    time: "19:00",
    summary: "Spaghetti bolognese",
    calories: 700,
    health_score: 70,
    user_input: "Comfort food",
  },
];

function seededRandom(seed) {
    let x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

function lcg(seed) {
    const a = 1664525; // multiplier
    const c = 1013904223; // increment
    const m = 2 ** 32; // modulus (32-bit)
    
    return (a * seed + c) % m;
  };
  
const chartData = (seed) => {
    const randUnder = (lcg(seed) % 20) + 1;  // Generate a random value for "Under"
    const randTarget = (lcg(lcg(seed)) % 20) + 1;  // Use a different seed to get a different number for "Target"
    const randOver = (lcg(lcg(lcg(seed))) % 20) + 1;  // Further modification for "Over"

    return [
        { range: "Under", frequency: randUnder },
        { range: "Target", frequency: randTarget },
        { range: "Over", frequency: randOver },
    ];
};
  
const chartConfig = {
    Wed: {
        label: "Wednesday",
        color: "#00ffff",
    },
    Thu: {
        label: "Thursday",
        color: "#00ffff",
    },
    Fri: {
        label: "Friday",
        color: "#00ffff",
    },
    Sat: {
        label: "Saturday",
        color: "#00ffff",
    },
    Sun: {
        label: "Sunday",
        color: "#00ffff",
    },
} satisfies ChartConfig;

interface PatientContextValue {
    patient: Patient | null;
    setPatient: (patient: Patient) => void;
}

const PatientContext = createContext<PatientContextValue | undefined>(
    undefined
);

const MatrixCell = memo(({value}: { value: number }) => {
    return (
        <div className="flex justify-center w-5 h-5 text-[8px] relative">
            <div
                className={`transition-all duration-200 items-center w-full h-full rounded-full `}
                style={{
                    backgroundColor: `rgb(${Math.max(255 - value * 2, 150)}, ${Math.max(
                        255 - value * 2,
                        150
                    )}, 255)`,
                    scale: value / 50,
                }}
            ></div>
        </div>
    );
});

const Matrix = memo(({matrix}: { matrix: number[][] }) => (
    <div className="grid grid-rows-21 grid-flow-col">
        {matrix.map((sub, i) => (
            <React.Fragment key={i}>
                {sub.map((v, j) => (
                    <MatrixCell key={i * 21 + j} value={v}/>
                ))}
            </React.Fragment>
        ))}
    </div>
));

export default function Home() {
    const points = [
        {x: 50, y: 100},
        {x: 150, y: 200},
        {x: 250, y: 150},
        {x: 350, y: 250},
        {x: 450, y: 100},
    ];

    const sectionHeaderRefs = [
        useRef<HTMLDivElement>(null),
        useRef<HTMLDivElement>(null),
        useRef<HTMLDivElement>(null),
    ];
    const viewPointerRef = useRef<HTMLDivElement>(null);
    const scrollContainer = useRef<HTMLDivElement>(null);
    const [scrollDepth, setScrollDepth] = useState(0);
    const [currentView, setCurrentView] = useState(0);
    const [_patient, setPatient] = useState<Patient | null>(patients[0]);
    const [patData, setPatData] = useState<any>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const openModal = () => {
      setIsModalOpen(true);
    };
  
    const closeModal = () => {
      setIsModalOpen(false);
    };

    async function loadSpecificPatient(patient) {
        setPatient(patient);
        console.log(patient.phone_number);
        const messagePayload = {
            phone_number: patient.phone_number
        }
        try {
            const response = await fetch('https://discrete-deer-obliging.ngrok-free.app/get_patient_data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                  },
                body: JSON.stringify(messagePayload),
            });
            if (response.ok) {
                const data = await response.json();
                // setPatData(userArray);
                console.log('User added successfully:', data);
            } else {
                console.log('Failed to add user:', response.statusText);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    async function loadAllPatientData() {
        try {
            const response = await fetch('https://discrete-deer-obliging.ngrok-free.app/get_all_data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    },
            });
            if (response.ok) {
                const data = await response.json();
                const userArray = Object.keys(data.data).map(key => {
                    const user = data.data[key].user;
                    const meals = data.data[key].meals;
                    const summary = data.data[key].summary;
                    return {
                        user_id: user.user_id,
                        name: user.name,
                        health_goal: user.health_goal,
                        phone_number: user.phone_number,
                        created_at: user.created_at,
                        meals,
                        summary
                    };
                });
                setPatData(userArray);
                console.log('all data got:', data);
            } else {
                console.log('all data not got:', response.statusText);
            }
        } catch (error) {
            console.error('bad error all data:', error);
        }
    }

    useLayoutEffect(() => {
        if (!viewPointerRef.current) return;
        for (let i = 0; i < 3; i++) {
            if (!sectionHeaderRefs[i].current) return;
        }

        const currentView = sectionHeaderRefs.filter((ref) => {
            if (!ref.current) return false;
            if (ref.current.getBoundingClientRect().bottom < 0) return true;
        }).length;

        setCurrentView(currentView);
    }, [scrollDepth]);

    const [matrixLeftFoot, setMatrixLeftFoot] = useState<number[][] | null>(Array.from({length: 8}, () => new Array(21).fill(0)));
    const [matrixRightFoot, setMatrixRightFoot] = useState<number[][] | null>(Array.from({length: 8}, () => new Array(21).fill(0)));

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    const dataPoint = useRef<Object | null>(null);

    useEffect(() => {
        loadAllPatientData();
    }, []);

    useLayoutEffect(() => {
        const updateMatrix = async () => {
            await sleep(100);
            const data = []
            for (let i = 0; i < 8; i++) {
                data.push(new Array(21).fill(0));
            }

            const bindings = {
                "heel": [5, 18],
                "left": [2, 5],
                "right": [6, 11],
            }

            for (const [key, value] of Object.entries(dataPoint.current ?? {})) {
                const pos = bindings[key];
                floodfill(data, pos[0], pos[1], value * 10);
            }

            setMatrixLeftFoot(data);
            requestAnimationFrame(updateMatrix);
        };

        requestAnimationFrame(updateMatrix);
    }, []);

    return (
        <PatientContext.Provider value={{_patient, setPatient}}>
            <div className="flex justify-between">
                <div className="flex gap-4 items-center">
                    <div className="w-8 h-8 rounded-full border-2 border-white"/>
                    <p className="text-white text-2xl">NutriLlama</p>
                </div>
                <div className="flex gap-4 items-center">
                    <p className="text-white text-2xl font-light">Dr. Mathew</p>
                    <Image
                        width={40}
                        height={40}
                        src="/Dr.png"
                        alt="Dr. Mathew"
                        className="w-10 h-10 rounded-full"
                    />
                </div>
            </div>

            <div
                className="grid grid-cols-[60px_3fr_1fr] gap-10 flex-grow mx-auto w-full max-w-[1 280px] overflow-hidden ">
                <div className="h-full flex flex-col pt-12 justify-between">
                    <div className="rounded-full backdrop-blur-sm bg-white/5 h-fit relative">
                        <div
                            className="bg-white rounded-full w-[60px] h-[60px] absolute shadow-lg transition-all z-[-50] ease-in-out"
                            ref={viewPointerRef}
                            style={{top: currentView * 33.33 + "%"}}
                        />
                        <div
                            className="w-[60px] h-[60px] rounded-full flex justify-center items-center cursor-pointer"
                            onClick={() => {
                                scrollContainer.current?.scrollTo({
                                    top: 0,
                                    behavior: "smooth",
                                });
                            }}
                        >
                            <RealtimeSvg fill={currentView != 0 ? "#fff" : "#2C7E85"}/>
                        </div>

                        <div
                            className="w-[60px] h-[60px] shadow-sm rounded-full flex justify-center items-center cursor-pointer"
                            onClick={() => {
                                sectionHeaderRefs[1].current?.scrollIntoView();
                            }}
                        >
                            <QuerySVG fill={currentView != 1 ? "#fff" : "#2C7E85"}/>
                        </div>
                        <div
                            className="w-[60px] h-[60px] shadow-sm rounded-full flex justify-center items-center cursor-pointer"
                            onClick={() => {
                                sectionHeaderRefs[2].current?.scrollIntoView();
                            }}
                        >
                            <NotesSVG fill={currentView != 2 ? "#fff" : "#2C7E85"}/>
                        </div>
                    </div>
                    <div
                        className="rounded-full opacity-50 hover:opacity-25 backdrop-blur-sm bg-white/5 h-[60px] border border-white/40 flex justify-center items-center">
                        <LogoutSVG/>
                    </div>
                </div>
                <div
                    className="overflow-y-scroll pt-12 h-full no-scrollbar mask-top "
                    ref={scrollContainer}
                    onScroll={(e) => {
                        setScrollDepth(e.currentTarget.scrollTop);
                    }}
                >
                    <div
                        className="text-white text-3xl flex items-center mb-5 gap-2 snap-start"
                        ref={sectionHeaderRefs[0]}
                    >
                        Goal: Lose 5kg
                        <div className="flex-grow h-[1px] bg-white/40 rounded-r-full"/>
                    </div>
                    <div className="grid grid-cols-[1fr_2fr] grid-rows-[300px_300px] gap-5 mb-10">
                        <div
                            className="w-full h-full backdrop-blur-sm bg-white/5 p-6 rounded-2xl shadow-lg relative col-span-1 overflow-hidden">
                            <div
                                className="absolute top-0 left-0 w-full h-full border border-[#d0ffffa1] mask-gradient-2 rounded-2xl"/>
                            <span className="text-white/80">Calorie count</span>
                            <ResponsiveContainer>
                                <BarChart data={chartData(_patient?.recentData)}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="range" />
                                    <YAxis allowDecimals={false} />
                                    <Tooltip />
                                    <Bar dataKey="frequency" fill="#8884d8" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div
                            className="w-full overflow-hidden h-full backdrop-blur-sm bg-white/5 p-6 rounded-2xl shadow-lg relative row-span-2 col-span-1">
                            <span className="text-white/80">Chat</span>
                            {/* <GetMyBrother> */}
                            {/* <Cube/> */}
                        </div>
                        <div
                            className="w-full h-full backdrop-blur-sm bg-white/5 p-6 rounded-2xl shadow-lg relative col-span-1">
                            <div
                                className="absolute top-0 left-0 w-full h-full border border-[#d0ffffa1] mask-gradient-2 rounded-2xl"/>
                            <span className="text-white/80">Daily Steps</span>
                            <Radial seed={_patient?.recentData}/>
                        </div>
                    </div>
                    <div
                        className="text-white text-4xl flex items-center mb-5 snap-start"
                        ref={sectionHeaderRefs[1]}
                    >
                        Patient breakdown
                    </div>
                    <div className="w-full flex flex-col backdrop-blur-sm bg-white/5 p-6 rounded-2xl shadow-lg mb-10 relative">
                    <div
                        className="absolute top-0 left-0 w-full h-full border border-[#d0ffffa1] mask-gradient-2 rounded-2xl"
                    />
                    <MealsSummary meals={sampleMeals} />

                    <ChatInput number={"+447505014078"} />
                    </div>
                    <div
                        className="text-white text-3xl flex items-center mb-5 gap-2 snap-start"
                        ref={sectionHeaderRefs[2]}
                    >
                        Alerts
                        <div className="flex-grow h-[1px] bg-white/40 rounded-r-full"/>
                    </div>
                    <div className="flex flex-col gap-5">
                        {/* {_patient?.alerts.map((alert, i) => (
                            <div
                                key={i}
                                className="bg-white/5 rounded-2xl p-4 backdrop-blur-sm"
                            >
                                <div
                                    className="absolute top-0 left-0 w-full h-full border border-[#d0ffffa1] mask-gradient-2 rounded-2xl"/>

                                <div className="text-white text-sm flex justify-between mb-2">
                                    <p
                                        className={
                                            (alert.severity == "High"
                                                ? "border-red-600"
                                                : alert.severity == "Medium"
                                                    ? "border-amber-500"
                                                    : "border-cyan-500") + " border-2  px-2 rounded-full"
                                        }
                                    >
                                        {alert.severity + " Severity"}
                                    </p>
                                    <p>
                                        {alert.datetime.toLocaleDateString("en-US", {
                                            weekday: "long",
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric",
                                        })}
                                    </p>
                                </div>
                                <div className="text-white text-[16px]">
                                    {alert.description}
                                </div>
                            </div>
                        ))} */}
                    </div>
                </div>
                <div className="w-full h-full flex flex-col pt-12">
                    <div className="text-white text-4xl flex items-center mb-5 snap-start">
                        Patients
                    </div>
                    <div
                        className="w-full flex-grow backdrop-blur-sm bg-white/5 p-6  rounded-2xl shadow-lg relative flex flex-col gap-8">
                        <div
                            className="absolute top-0 left-0 w-full h-full pointer-events-none border border-[#d0ffffa1] mask-gradient rounded-2xl"/>
                        {patients.map((patient, index) => (
                            <div
                                onClick={() => setPatient(patient)}
                                className={
                                    "flex gap-6 items-center cursor-pointer transition-all " +
                                    (_patient == patient && "bg-white/5 rounded-full")
                                }
                                key={patient.name}
                            >
                                <Image
                                    className="rounded-full"
                                    width={50}
                                    height={50}
                                    src={images[index]}
                                    alt={patient.name}
                                />
                                <span className="text-white text-[16px]">{patient.name}</span>
                            </div>
                        ))}
                        {
                            patData.length > 0 &&
                            // console.log(patData[0].name) &&
                            // console.log(patData) &&
                            patData.map((patient) => (
                                <div
                                    onClick={() => loadSpecificPatient(patient)}
                                    className={
                                        "flex gap-6 items-center cursor-pointer transition-all " +
                                        (_patient == patient && "bg-white/5 rounded-full")
                                    }
                                    key={patient.name}
                                >
                                    <Image
                                        className="rounded-full"
                                        width={50}
                                        height={50}
                                        src = {"/a.png"}
                                        alt={patient.name}
                                    />
                                    <span className="text-white text-[16px]">{patient.name}</span>
                                </div>
                            ))
                        }
                        <div
                                onClick={() => {
                                    openModal()
                                }}
                                className={
                                    "flex gap-6 items-center cursor-pointer transition-all" +
                                    ("bg-white/5 rounded-full")
                                }
                                key={"racc"}
                            >
                                <Plus className="text-white text-xl" />
                                <span className="text-white text-[16px]">Add user</span>
                            </div>
                    </div>
                </div>
                {isModalOpen && <Modal onClose={closeModal} />}
            </div>
        </PatientContext.Provider>
    );
}
