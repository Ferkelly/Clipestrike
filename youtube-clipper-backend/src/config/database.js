const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// Funções helpers
const db = {
  // Usuários
  async createUser(userData) {
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getUserByEmail(email) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async updateUser(userId, userData) {
    const { data, error } = await supabase
      .from('users')
      .update({ ...userData, updated_at: new Date() })
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteUser(userId) {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);
    if (error) throw error;
    return true;
  },

  // Canais
  async createChannel(channelData) {
    const { data, error } = await supabase
      .from('channels')
      .upsert(channelData, { onConflict: 'youtube_channel_id' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getChannelByYoutubeId(youtubeChannelId) {
    const { data, error } = await supabase
      .from('channels')
      .select('*, users(*)')
      .eq('youtube_channel_id', youtubeChannelId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async getAllActiveChannels() {
    const { data, error } = await supabase
      .from('channels')
      .select('*')
      .eq('is_active', true);
    if (error) throw error;
    return data;
  },

  // Vídeos
  async createVideo(videoData) {
    const { data, error } = await supabase
      .from('videos')
      .upsert(videoData, { onConflict: 'youtube_video_id,user_id' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getVideoByYoutubeId(videoId) {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('youtube_video_id', videoId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async getUnprocessedVideos() {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('status', 'pending')
      .order('published_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async updateVideoStatus(videoId, status, updates = {}) {
    const { data, error } = await supabase
      .from('videos')
      .update({ status, ...updates, updated_at: new Date() })
      .eq('id', videoId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Clips
  async createClip(clipData) {
    const { data, error } = await supabase
      .from('clips')
      .insert([clipData])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getClipsByVideo(videoId) {
    const { data, error } = await supabase
      .from('clips')
      .select('*')
      .eq('video_id', videoId)
      .order('viral_score', { ascending: false });
    if (error) throw error;
    return data;
  },

  async updateClipStatus(clipId, status, updates = {}) {
    const { data, error } = await supabase
      .from('clips')
      .update({ status, ...updates, updated_at: new Date() })
      .eq('id', clipId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Storage (para arquivos)
  async uploadFile(bucket, path, file) {
    const { data, error } = await supabase
      .storage
      .from(bucket)
      .upload(path, file);
    if (error) throw error;
    return data;
  },

  async getPublicUrl(bucket, path) {
    const { data } = supabase
      .storage
      .from(bucket)
      .getPublicUrl(path);
    return data.publicUrl;
  }
};

module.exports = { supabase, db };
