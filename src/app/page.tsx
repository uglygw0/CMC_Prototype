"use client";

import React, { useState, useEffect } from "react";
import { Check, Ticket, Users, Home, Gift, UserPlus, ShoppingBag, ArrowRight, AlertCircle, Phone, Store, User, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// ----------------------------------------------------------------------
// Mock Data & Constants
// ----------------------------------------------------------------------
const STORE_NAMES = [
  "카페 일상", "맛나 식당", "청춘 분식", "알파 문구", "마카롱 팩토리", 
  "고기창고", "스터디카페", "홍콩반점", "파스타 바", "샐러드볼", 
  "동네포차", "라멘집", "베이커리", "편의점", "꽃집", 
  "버거타운", "아이스크림", "명랑핫도그", "대학서점", "김밥천국", 
  "초밥집", "피자하우스", "치킨나라", "와플대학", "로스터리"
];

// Shuffle helper
const shuffleArray = (array: string[]) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

// Check bingo logic
const checkBingos = (stamped: boolean[]) => {
  const lines = [
    [0, 1, 2, 3, 4], [5, 6, 7, 8, 9], [10, 11, 12, 13, 14], [15, 16, 17, 18, 19], [20, 21, 22, 23, 24], // Horizontal
    [0, 5, 10, 15, 20], [1, 6, 11, 16, 21], [2, 7, 12, 17, 22], [3, 8, 13, 18, 23], [4, 9, 14, 19, 24], // Vertical
    [0, 6, 12, 18, 24], [4, 8, 12, 16, 20] // Diagonal
  ];
  let count = 0;
  for (const line of lines) {
    if (line.every(index => stamped[index])) count++;
  }
  return count;
};

// ----------------------------------------------------------------------
// Main Application Component
// ----------------------------------------------------------------------
export default function BingMoneyApp() {
  // App State
  const [view, setView] = useState<"login" | "signup" | "app">("login");
  const [activeTab, setActiveTab] = useState<"home" | "coupons" | "friends">("home");
  const [toastMessage, setToastMessage] = useState("");

  // User State
  const [user, setUser] = useState({ name: "", phone: "", birth: "" });
  
  // Bingo State
  const [board, setBoard] = useState<{ id: number; name: string; stamped: boolean }[]>([]);
  const [bingoCount, setBingoCount] = useState(0);
  
  // Reward State
  const [coupons, setCoupons] = useState<{ id: string; title: string; used: boolean; date: string }[]>([
    { id: "c1", title: "[가입축하] 상권 전용 1,000원 할인권", used: false, date: "방금 전" }
  ]);
  
  // Friends State
  const [friends, setFriends] = useState([
    { id: "f1", name: "김민수", phone: "010-1234-5678", bingoCount: 2 },
    { id: "f2", name: "이지은", phone: "010-9876-5432", bingoCount: 0 }
  ]);
  const [newFriendPhone, setNewFriendPhone] = useState("");

  // Initialize board on load
  useEffect(() => {
    const shuffled = shuffleArray(STORE_NAMES);
    setBoard(shuffled.map((name, idx) => ({ id: idx, name, stamped: false })));
  }, []);

  // Toast Helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  // ----------------------------------------------------------------------
  // Handlers
  // ----------------------------------------------------------------------
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user.phone) {
      showToast("전화번호를 입력해주세요.");
      return;
    }
    setView("app");
    showToast("환영합니다!");
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user.name || !user.phone || !user.birth) {
      showToast("모든 항목을 입력해주세요.");
      return;
    }
    setView("app");
    showToast("회원가입이 완료되었습니다!");
  };

  const handleMockPurchase = () => {
    // Find an unstamped cell
    const unstamped = board.filter(cell => !cell.stamped);
    if (unstamped.length === 0) {
      showToast("이미 모든 빙고를 완료하셨습니다!");
      return;
    }
    
    // Pick random cell to stamp
    const target = unstamped[Math.floor(Math.random() * unstamped.length)];
    const newBoard = board.map(cell => cell.id === target.id ? { ...cell, stamped: true } : cell);
    setBoard(newBoard);
    
    const newBingoCount = checkBingos(newBoard.map(c => c.stamped));
    
    // Check if new bingo achieved
    if (newBingoCount > bingoCount) {
      setBingoCount(newBingoCount);
      if (newBingoCount >= 3 && bingoCount < 3) {
        // Reward at 3 bingos
        setCoupons([{ id: Date.now().toString(), title: "[3빙고 달성] 상권 3,000원 할인권", used: false, date: "방금 전" }, ...coupons]);
        showToast("축하합니다! 3빙고 달성으로 할인 쿠폰이 지급되었습니다.");
      } else {
        showToast(`빙고 1줄 완성! 현재 ${newBingoCount}빙고입니다.`);
      }
    } else {
      showToast(`'${target.name}'에서 결제가 확인되어 스탬프가 찍혔습니다!`);
    }
  };

  const handleUseCoupon = (id: string) => {
    setCoupons(coupons.map(c => c.id === id ? { ...c, used: true } : c));
    showToast("쿠폰이 사용 처리되었습니다.");
  };

  const handleAddFriend = () => {
    if (!newFriendPhone.trim()) {
      showToast("친구의 전화번호를 입력해주세요.");
      return;
    }
    setFriends([...friends, { id: Date.now().toString(), name: "새로운 친구", phone: newFriendPhone, bingoCount: 0 }]);
    setNewFriendPhone("");
    showToast("친구가 성공적으로 추가되었습니다.");
  };

  // ----------------------------------------------------------------------
  // Render
  // ----------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-100 flex justify-center items-center p-4 font-sans text-slate-900">
      
      {/* Mobile Frame Container */}
      <div className="w-full max-w-[400px] h-[800px] max-h-screen bg-white rounded-3xl shadow-2xl overflow-hidden relative flex flex-col border-4 border-slate-800">
        
        {/* Global Toast */}
        {toastMessage && (
          <div className="absolute top-4 left-4 right-4 z-50 animate-in fade-in slide-in-from-top-4">
            <div className="bg-slate-800 text-white px-4 py-3 rounded-lg shadow-lg text-sm font-medium flex items-center justify-between">
              <span>{toastMessage}</span>
              <button onClick={() => setToastMessage("")}><X size={16} /></button>
            </div>
          </div>
        )}

        {/* --- VIEW: LOGIN --- */}
        {view === "login" && (
          <div className="flex-1 flex flex-col p-6 overflow-y-auto">
            <div className="flex-1 flex flex-col items-center justify-center space-y-8">
              <div className="text-center space-y-2">
                <div className="bg-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <MapPin size={32} className="text-white" />
                </div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">BINGMONEY</h1>
                <p className="text-slate-500 text-sm">대학 상권을 깨우는 달콤한 보상</p>
              </div>
              
              <Card className="w-full border-none shadow-none">
                <form onSubmit={handleLogin}>
                  <CardContent className="space-y-4 px-0">
                    <div className="space-y-2">
                      <Label htmlFor="phone">전화번호</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input 
                          id="phone" 
                          placeholder="010-0000-0000" 
                          className="pl-9 bg-slate-50"
                          value={user.phone}
                          onChange={(e) => setUser({...user, phone: e.target.value})}
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-md py-6">
                      로그인
                    </Button>
                  </CardContent>
                </form>
                <CardFooter className="px-0 flex justify-center">
                  <Button variant="link" onClick={() => setView("signup")} className="text-indigo-600">
                    처음이신가요? 회원가입하기
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        )}

        {/* --- VIEW: SIGNUP --- */}
        {view === "signup" && (
          <div className="flex-1 flex flex-col p-6 overflow-y-auto">
            <div className="mb-6">
              <Button variant="ghost" size="icon" onClick={() => setView("login")} className="-ml-2">
                <ArrowRight className="h-5 w-5 rotate-180" />
              </Button>
            </div>
            <h2 className="text-2xl font-bold mb-2">반갑습니다!</h2>
            <p className="text-slate-500 text-sm mb-8">기본 정보를 입력하고 주변 상권 혜택을 누려보세요.</p>
            
            <form onSubmit={handleSignup} className="space-y-6 flex-1 flex flex-col">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">이름</Label>
                  <Input 
                    id="signup-name" 
                    placeholder="홍길동" 
                    value={user.name}
                    onChange={(e) => setUser({...user, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-phone">전화번호</Label>
                  <Input 
                    id="signup-phone" 
                    placeholder="010-0000-0000" 
                    value={user.phone}
                    onChange={(e) => setUser({...user, phone: e.target.value})}
                  />
                  <p className="text-xs text-slate-500">결제 시 이 번호로 스탬프가 적립됩니다.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-birth">생년월일</Label>
                  <Input 
                    id="signup-birth" 
                    placeholder="YYYYMMDD (예: 20010505)" 
                    value={user.birth}
                    onChange={(e) => setUser({...user, birth: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="mt-auto pt-6">
                <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 py-6 text-md">
                  동의하고 시작하기
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* --- VIEW: MAIN APP --- */}
        {view === "app" && (
          <>
            {/* Top Bar */}
            <header className="bg-white px-5 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <div className="bg-indigo-600 p-1.5 rounded-lg">
                  <MapPin size={16} className="text-white" />
                </div>
                <h1 className="font-bold text-lg tracking-tight">BINGMONEY</h1>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                <User size={16} className="text-slate-600" />
              </div>
            </header>

            {/* Scrollable Content */}
            <main className="flex-1 overflow-y-auto bg-slate-50 pb-20">
              
              {/* HOME TAB */}
              {activeTab === "home" && (
                <div className="p-5 space-y-6">
                  {/* Action Mock Card */}
                  <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 border-none text-white shadow-md">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <ShoppingBag size={18} />
                        방금 가게에서 결제하셨나요?
                      </CardTitle>
                      <CardDescription className="text-indigo-100">
                        전화번호를 통해 자동으로 스탬프가 적립됩니다. MVP 검증을 위해 아래 버튼을 눌러보세요.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        onClick={handleMockPurchase} 
                        className="w-full bg-white text-indigo-600 hover:bg-slate-100 font-bold"
                      >
                        결제 확인 목업 실행하기
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Bingo Status */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold">우리 동네 빙고판</h2>
                      <p className="text-sm text-slate-500">다양한 가게를 방문하고 보상을 받으세요!</p>
                    </div>
                    <Badge variant={bingoCount >= 3 ? "default" : "secondary"} className={bingoCount >= 3 ? "bg-green-500 hover:bg-green-600" : ""}>
                      {bingoCount} 빙고 달성
                    </Badge>
                  </div>

                  {/* Bingo Grid 5x5 */}
                  <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
                    <div className="grid grid-cols-5 gap-1.5">
                      {board.map((cell) => (
                        <div 
                          key={cell.id} 
                          className={`
                            relative aspect-square rounded-lg flex flex-col items-center justify-center p-1 text-center transition-all
                            ${cell.stamped 
                              ? 'bg-indigo-50 border-2 border-indigo-500' 
                              : 'bg-slate-50 border border-slate-100 hover:bg-slate-100'}
                          `}
                        >
                          <span className={`text-[10px] font-medium leading-tight ${cell.stamped ? 'text-indigo-700' : 'text-slate-600'}`}>
                            {cell.name}
                          </span>
                          
                          {/* Stamp Mark */}
                          {cell.stamped && (
                            <div className="absolute inset-0 flex items-center justify-center bg-indigo-500/10 rounded-lg animate-in zoom-in-50 duration-300">
                              <div className="w-8 h-8 rounded-full border-2 border-indigo-500 flex items-center justify-center text-indigo-500 transform -rotate-12 bg-white/80 backdrop-blur-sm shadow-sm">
                                <Check size={18} strokeWidth={3} />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <Alert className="bg-blue-50 border-blue-100">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertTitle className="text-blue-800 font-bold">3빙고를 완성해보세요!</AlertTitle>
                    <AlertDescription className="text-blue-700 text-sm mt-1">
                      3빙고 달성 시 가맹점에서 사용 가능한 3,000원 할인 쿠폰이 즉시 지급됩니다.
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {/* COUPONS TAB */}
              {activeTab === "coupons" && (
                <div className="p-5 space-y-4">
                  <div>
                    <h2 className="text-xl font-bold">내 쿠폰함</h2>
                    <p className="text-sm text-slate-500">달성한 보상을 매장에서 사용하세요.</p>
                  </div>
                  
                  {coupons.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <Gift size={48} className="mx-auto mb-3 opacity-20" />
                      <p>아직 보유한 쿠폰이 없습니다.</p>
                      <p className="text-sm">빙고를 완성하고 쿠폰을 받아보세요!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {coupons.map(coupon => (
                        <Card key={coupon.id} className={`overflow-hidden transition-opacity ${coupon.used ? 'opacity-60 bg-slate-50' : 'bg-white'}`}>
                          <div className="flex">
                            {/* Decorative Left Border */}
                            <div className={`w-3 ${coupon.used ? 'bg-slate-300' : 'bg-indigo-500'}`} />
                            <div className="flex-1 p-4">
                              <div className="flex justify-between items-start mb-2">
                                <h3 className={`font-bold ${coupon.used ? 'text-slate-500' : 'text-slate-900'}`}>{coupon.title}</h3>
                                {coupon.used && <Badge variant="outline">사용 완료</Badge>}
                              </div>
                              <p className="text-xs text-slate-400 mb-4">발급일: {coupon.date}</p>
                              
                              <Button 
                                variant={coupon.used ? "secondary" : "default"} 
                                className={`w-full ${!coupon.used && 'bg-indigo-600 hover:bg-indigo-700'}`}
                                disabled={coupon.used}
                                onClick={() => handleUseCoupon(coupon.id)}
                              >
                                {coupon.used ? "사용된 쿠폰입니다" : "매장에서 사용하기"}
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* FRIENDS TAB */}
              {activeTab === "friends" && (
                <div className="p-5 space-y-6">
                  <div>
                    <h2 className="text-xl font-bold">친구 목록</h2>
                    <p className="text-sm text-slate-500">친구들과 진행 상황을 공유해보세요.</p>
                  </div>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <UserPlus size={16} /> 친구 추가
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Input 
                          placeholder="전화번호 입력 (010...)" 
                          value={newFriendPhone}
                          onChange={(e) => setNewFriendPhone(e.target.value)}
                        />
                        <Button onClick={handleAddFriend} className="bg-slate-900">추가</Button>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-slate-500 px-1">등록된 친구 ({friends.length})</h3>
                    {friends.map(friend => (
                      <div key={friend.id} className="bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                            {friend.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-sm">{friend.name}</p>
                            <p className="text-xs text-slate-500">{friend.phone}</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-indigo-50 text-indigo-700">
                          {friend.bingoCount} 빙고
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </main>

            {/* Bottom Navigation */}
            <nav className="bg-white border-t border-slate-200 flex items-center justify-around pb-6 pt-3 px-2 absolute bottom-0 w-full z-10">
              <button 
                onClick={() => setActiveTab("home")} 
                className={`flex flex-col items-center gap-1 p-2 ${activeTab === "home" ? "text-indigo-600" : "text-slate-400"}`}
              >
                <Store size={24} className={activeTab === "home" ? "fill-indigo-50" : ""} />
                <span className="text-[10px] font-medium">빙고판</span>
              </button>
              
              <button 
                onClick={() => setActiveTab("coupons")} 
                className={`flex flex-col items-center gap-1 p-2 ${activeTab === "coupons" ? "text-indigo-600" : "text-slate-400"}`}
              >
                <Ticket size={24} className={activeTab === "coupons" ? "fill-indigo-50" : ""} />
                <span className="text-[10px] font-medium">내 쿠폰</span>
              </button>
              
              <button 
                onClick={() => setActiveTab("friends")} 
                className={`flex flex-col items-center gap-1 p-2 ${activeTab === "friends" ? "text-indigo-600" : "text-slate-400"}`}
              >
                <Users size={24} className={activeTab === "friends" ? "fill-indigo-50" : ""} />
                <span className="text-[10px] font-medium">친구 목록</span>
              </button>
            </nav>
          </>
        )}
      </div>
    </div>
  );
}
