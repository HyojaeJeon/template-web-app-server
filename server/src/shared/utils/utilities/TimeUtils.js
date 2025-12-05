/**
 * 시간 관련 통합 유틸리티
 * Local 시간대, 날짜 포맷팅, 시간 계산
 */

import moment from 'moment-timezone';

class TimeUtils {
  constructor() {
    // Local 시간대 설정                                            // UTC+7 호치민시
    this.vietnamTimezone = 'Asia/Ho_Chi_Minh';
    this.defaultFormat = 'YYYY-MM-DD HH:mm:ss';
    
    // Local 공휴일 (음력 제외)                                     // 양력 공휴일만
    this.vietnamHolidays = [
      '01-01', // 신정
      '04-30', // 남부 해방절
      '05-01', // 노동절
      '09-02', // 국경일
    ];
  }

  /**
   * 현재 Local 시간 가져오기
   */
  getCurrentVietnamTime() {                                         // 호치민 현재 시간
    return moment().tz(this.vietnamTimezone);
  }

  /**
   * UTC를 Local 시간으로 변환
   */
  utcToVietnam(utcTime) {                                          // UTC → Local
    return moment(utcTime).tz(this.vietnamTimezone);
  }

  /**
   * Local 시간을 UTC로 변환
   */
  vietnamToUTC(vietnamTime) {                                      // Local → UTC
    return moment.tz(vietnamTime, this.vietnamTimezone).utc();
  }

  /**
   * 날짜 포맷팅
   */
  formatDate(date, format = this.defaultFormat) {                  // 날짜 형식화
    return moment(date).tz(this.vietnamTimezone).format(format);
  }

  /**
   * 상대 시간 표시 (몇 분 전, 몇 시간 전)
   */
  getRelativeTime(date, locale = 'vi') {                          // 상대 시간
    moment.locale(locale);
    return moment(date).tz(this.vietnamTimezone).fromNow();
  }

  /**
   * 두 날짜 사이 차이 계산
   */
  getDifference(date1, date2, unit = 'minutes') {                  // 시간 차이
    const m1 = moment(date1).tz(this.vietnamTimezone);
    const m2 = moment(date2).tz(this.vietnamTimezone);
    return Math.abs(m1.diff(m2, unit));
  }

  /**
   * 영업 시간 체크
   */
  isBusinessHours(openTime, closeTime, currentTime = null) {       // 영업 중 확인
    const now = currentTime ? 
      moment(currentTime).tz(this.vietnamTimezone) : 
      this.getCurrentVietnamTime();
    
    const open = moment(openTime, 'HH:mm').tz(this.vietnamTimezone);
    const close = moment(closeTime, 'HH:mm').tz(this.vietnamTimezone);
    
    // 자정을 넘는 경우 처리                                        // 24시간 영업
    if (close.isBefore(open)) {
      return now.isAfter(open) || now.isBefore(close);
    }
    
    return now.isBetween(open, close);
  }

  /**
   * 배달 예상 시간 계산
   */
  calculateDeliveryTime(distance, preparationTime = 15) {          // 배달 시간 예측
    const baseTime = 10; // 기본 10분
    const timePerKm = 5; // km당 5분
    const totalMinutes = baseTime + preparationTime + (distance * timePerKm);
    
    return {
      minutes: totalMinutes,
      estimatedTime: this.getCurrentVietnamTime().add(totalMinutes, 'minutes'),
      range: {
        min: totalMinutes - 5,
        max: totalMinutes + 10
      }
    };
  }

  /**
   * 예약 가능 시간 슬롯 생성
   */
  generateTimeSlots(startTime, endTime, interval = 30) {           // 시간 슬롯 생성
    const slots = [];
    const start = moment(startTime, 'HH:mm').tz(this.vietnamTimezone);
    const end = moment(endTime, 'HH:mm').tz(this.vietnamTimezone);
    
    while (start.isBefore(end)) {
      slots.push({
        time: start.format('HH:mm'),
        display: start.format('h:mm A'),
        value: start.toISOString()
      });
      start.add(interval, 'minutes');
    }
    
    return slots;
  }

  /**
   * 공휴일 체크
   */
  isHoliday(date) {                                                // 공휴일 확인
    const dateStr = moment(date).tz(this.vietnamTimezone).format('MM-DD');
    return this.vietnamHolidays.includes(dateStr);
  }

  /**
   * 주말 체크
   */
  isWeekend(date) {                                                // 주말 확인
    const day = moment(date).tz(this.vietnamTimezone).day();
    return day === 0 || day === 6; // 일요일 또는 토요일
  }

  /**
   * 날짜 유효성 검사
   */
  isValidDate(dateString, format = 'YYYY-MM-DD') {                 // 날짜 검증
    return moment(dateString, format, true).isValid();
  }

  /**
   * 나이 계산
   */
  calculateAge(birthDate) {                                        // 나이 계산
    return moment().tz(this.vietnamTimezone).diff(moment(birthDate), 'years');
  }

  /**
   * 타임스탬프 생성
   */
  getTimestamp() {                                                 // Unix 타임스탬프
    return moment().tz(this.vietnamTimezone).unix();
  }

  /**
   * ISO 문자열 생성
   */
  getISOString(date = null) {                                      // ISO 8601 형식
    const d = date ? moment(date) : moment();
    return d.tz(this.vietnamTimezone).toISOString();
  }

  /**
   * 날짜 범위 체크
   */
  isInRange(date, startDate, endDate) {                           // 범위 내 확인
    const d = moment(date).tz(this.vietnamTimezone);
    const start = moment(startDate).tz(this.vietnamTimezone);
    const end = moment(endDate).tz(this.vietnamTimezone);
    return d.isBetween(start, end, null, '[]');
  }

  /**
   * 월의 첫날/마지막날 가져오기
   */
  getMonthBoundaries(date = null) {                               // 월 경계
    const d = date ? moment(date) : moment();
    const month = d.tz(this.vietnamTimezone);
    
    return {
      firstDay: month.clone().startOf('month'),
      lastDay: month.clone().endOf('month'),
      daysInMonth: month.daysInMonth()
    };
  }

  /**
   * 주문 마감 시간 계산
   */
  getOrderCutoffTime(deliveryTime, preparationMinutes = 30) {      // 주문 마감 시간
    return moment(deliveryTime)
      .tz(this.vietnamTimezone)
      .subtract(preparationMinutes, 'minutes');
  }
}

// 싱글톤 인스턴스                                                   // 전역 시간 유틸
const timeUtils = new TimeUtils();

export default timeUtils;
export { TimeUtils };